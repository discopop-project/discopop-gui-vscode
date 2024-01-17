import * as fs from 'fs'
import { DiscoPoPRunner } from './DiscoPoPRunner'
import { exec } from 'child_process'
import { CancelToken } from '../../Utils/CancelToken'
import { Config } from '../../Utils/Config'
import { DiscoPoPResults } from '../classes/DiscoPoPResults'
import { CancellationError } from '../../Utils/CancellationError'

export class DiscoPoPCMakeWorkflowRunner {
    /**
     *
     * @param projectDirectory
     * @param executableName
     * @param executableArguments defaults to ""
     * @param buildDirectory defaults to <projectDirectory>/build/DiscoPoP
     * @param dotDiscoPoP defaults to <projectDirectory>/build/.discopop
     */
    public constructor(
        public readonly projectDirectory: string,
        public readonly executableName: string,
        public readonly executableArguments: string = '',
        public readonly buildDirectory?: string,
        public readonly dotDiscoPoP?: string
    ) {
        if (!this.buildDirectory) {
            this.buildDirectory = projectDirectory + '/build/DiscoPoP'
        }

        if (!this.dotDiscoPoP) {
            this.dotDiscoPoP = projectDirectory + 'build/.discopop'
        }
    }

    /**
     * runs the entire cmake workflow.
     * @param reportMessage report a message to the user, the optional nesting parameter can be used to indicate that a message is related to a subtask of a previous message
     * @param reportProgress report the current progress of the operation, the progress parameter should be a number between 0 and 100 and indicates the progress made since the last call to reportProgress.
     * @param requestConfirmation a callback that can be used to request confirmation from the user
     * @param cancelToken a token that can be used to cancel the operation from the outside
     * @returns the parsed DiscoPoP results
     */
    public async run(
        reportMessage: (message: string, nesting: number) => void,
        reportProgress: (progress: number) => void,
        requestConfirmation: (message: string) => Promise<boolean>,
        cancelToken: CancelToken
    ): Promise<DiscoPoPResults> {
        const dpRunner = new DiscoPoPRunner(this.dotDiscoPoP)

        reportMessage('Preparing...', 0)
        await this.prepare(requestConfirmation)
        reportProgress(5)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running CMake...', 0)
        await this.runCMake(cancelToken)
        reportProgress(10)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running Make...', 0)
        await this.runMake(cancelToken)
        reportProgress(10)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running Instrumented Executable...', 0)
        await this.runInstrumentedExecutable(cancelToken)
        reportProgress(30)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running Pattern Detection...', 0)
        await dpRunner.runExplorer(cancelToken) // arguments?
        reportProgress(30)
        this.throwUponCancellation(cancelToken)

        reportMessage('Generating Patches...', 0)
        await dpRunner.runPatchGenerator(cancelToken) // arguments?
        reportProgress(10)
        this.throwUponCancellation(cancelToken)

        reportMessage('Parsing Results...', 0)
        const results = dpRunner.parse() // does not support cancellation
        reportProgress(5)

        return results
    }

    private throwUponCancellation(cancelToken: CancelToken): void {
        if (cancelToken.cancellationRequested) {
            throw new CancellationError('Operation was cancelled')
        }
    }

    private async prepare(
        requestConfirmation: (message) => Promise<boolean>
    ): Promise<void> {
        if (!fs.existsSync(this.buildDirectory)) {
            fs.mkdirSync(this.buildDirectory, {
                recursive: true,
            })
        } else if (
            Config.skipOverwriteConfirmation() ||
            (await requestConfirmation(
                'The build directory already exists. Do you want to overwrite it?\n(You can disable this dialog in the extension settings)'
            ))
        ) {
            fs.rmSync(this.buildDirectory, {
                recursive: true,
            })
            fs.mkdirSync(this.buildDirectory, {
                recursive: true,
            })
        } else {
            throw new Error('Operation cancelled by user')
        }
    }

    // TODO support build arguments
    private async runCMake(cancelToken: CancelToken): Promise<void> {
        const cmakeWrapperScript = `${Config.discopopBuild()}/scripts/CMAKE_wrapper.sh`
        let outerResolve: () => void
        return new Promise<void>((resolve, reject) => {
            outerResolve = resolve

            const onCancel = () => {
                childProcess.kill() // SIGINT or SIGTERM?
                outerResolve?.()
            }

            const childProcess = exec(
                `${cmakeWrapperScript} ${this.projectDirectory}`,
                {
                    cwd: this.buildDirectory,
                    // DOT_DISCOPOP is not set on purpose --> creates .discopop locally, we then delete it after the call to cmake
                    // this ensures that cmake compiler tests do not influence the results
                },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                'CMAKE failed: ' + err.message + '\n' + stderr
                            )
                        )
                    } else {
                        // delete the locally created .discopop directory --> ensures that cmake compiler tests do not influence the results
                        fs.rmSync(this.buildDirectory + '/.discopop', {
                            recursive: true,
                            force: true,
                        })
                        cancelToken.emitter.removeListener('cancel', onCancel)
                        resolve()
                    }
                }
            )
            cancelToken.emitter.on('cancel', onCancel)
        })
    }

    private async runMake(cancelToken: CancelToken): Promise<void> {
        let outerResolve: () => void
        return new Promise<void>((resolve, reject) => {
            outerResolve = resolve
            const childProcess = exec(
                `make > make.log 2>&1`,
                {
                    cwd: this.buildDirectory,
                    env: {
                        ...process.env,
                        DOT_DISCOPOP: this.dotDiscoPoP,
                    },
                },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(new Error('MAKE failed: ' + err.message))
                    } else {
                        resolve()
                    }
                }
            )
            cancelToken.emitter.on('cancel', async () => {
                console.log('DiscoPoPRunner::cancellation requested::MAKE')
                childProcess.kill() // SIGINT or SIGTERM?
                outerResolve?.()
            })
        })
    }

    private runInstrumentedExecutable(cancelToken: CancelToken): Promise<void> {
        let outerResolve: () => void
        return new Promise<void>((resolve, reject) => {
            outerResolve = resolve
            const childProcess = exec(
                `${this.buildDirectory}/${this.executableName} ${this.executableArguments}`,
                {
                    cwd: this.buildDirectory,
                    env: {
                        ...process.env,
                        DOT_DISCOPOP: this.dotDiscoPoP,
                    },
                },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(new Error('Executable failed: ' + err.message))
                        // TODO maybe it is acceptable for the executable to fail?
                    } else {
                        resolve()
                    }
                }
            )
            cancelToken.emitter.on('cancel', async () => {
                console.log(
                    'DiscoPoPRunner::cancellation requested::executable'
                )
                childProcess.kill() // SIGINT or SIGTERM?
                outerResolve?.()
            })
        })
    }
}
