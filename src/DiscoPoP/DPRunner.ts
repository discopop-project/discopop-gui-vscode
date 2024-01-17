import * as fs from 'fs'
import * as vscode from 'vscode'
import { exec } from 'child_process'
import { DiscoPoPResults } from './classes/DiscoPoPResults'
import { Config } from '../Utils/Config'
import { EventEmitter } from 'events'
import { UIPrompts } from '../Utils/UIPrompts'
import { DiscoPoPParser } from './DiscoPoPParser'

export type CancelToken = {
    emitter: EventEmitter // emits "cancel" event when cancellation is requested
    cancellationRequested: boolean
}

/** provides functions to run the DiscoPoP tools */
export class DPRunner {
    public constructor(public readonly dotDiscoPoP: string) {}

    public get discopopVersion(): string {
        return '' // TODO
    }

    public get discopopBuild(): string {
        return Config.discopopBuild() // TODO replace with discopop_config_provider
    }

    public async runExplorer(cancelToken: CancelToken): Promise<void> {
        let outerResolve: () => void
        return new Promise<void>((resolve, reject) => {
            outerResolve = resolve
            const childProcess = exec(
                `discopop_explorer`,
                {
                    cwd: this.dotDiscoPoP,
                },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                'discopop_explorer failed: ' + err.message
                            )
                        )
                    } else {
                        resolve()
                    }
                }
            )
            cancelToken.emitter.on('cancel', async () => {
                console.log(
                    'DiscoPoPRunner::cancellation requested::discopop_explorer'
                )
                childProcess.kill() // SIGINT or SIGTERM?
                outerResolve?.()
            })
        })
    }
    public async runPatchGenerator(cancelToken: CancelToken): Promise<void> {
        let outerResolve: () => void
        return new Promise<void>((resolve, reject) => {
            outerResolve = resolve
            const childProcess = exec(
                `discopop_patch_generator`,
                {
                    cwd: this.dotDiscoPoP,
                },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                'discopop_patch_generator failed: ' +
                                    err.message +
                                    '\n' +
                                    stderr
                            )
                        )
                    } else {
                        resolve()
                    }
                }
            )
            cancelToken.emitter.on('cancel', async () => {
                console.log(
                    'DiscoPoPRunner::cancellation requested::discopop_patch_generator'
                )
                childProcess.kill() // SIGINT or SIGTERM?
                outerResolve?.()
            })
        })
    }

    public async parse(): Promise<DiscoPoPResults> {
        return DiscoPoPParser.parse(this.dotDiscoPoP)
    }

    public async runPatchApplicator(): Promise<void> {}
    public async runOptimizer(): Promise<void> {}
}

export class DPRunnerCMake {
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
     * @param reportProgress report the current progress of the operation, the progress parameter should be a number between 0 and 100 and indicates total completed progress in percent
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
        const dpRunner = new DPRunner(this.dotDiscoPoP)

        reportMessage('Preparing...', 0)
        await this.prepare(requestConfirmation)
        reportProgress(10)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running CMake...', 0)
        await this.runCMake(cancelToken)
        reportProgress(20)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running Make...', 0)
        await this.runMake(cancelToken)
        reportProgress(40)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running Instrumented Executable...', 0)
        await this.runInstrumentedExecutable(cancelToken)
        reportProgress(60)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running Pattern Detection...', 0)
        await dpRunner.runExplorer(cancelToken) // arguments?
        reportProgress(80)
        this.throwUponCancellation(cancelToken)

        reportMessage('Generating Patches...', 0)
        await dpRunner.runPatchGenerator(cancelToken) // arguments?
        reportProgress(90)
        this.throwUponCancellation(cancelToken)

        reportMessage('Parsing Results...', 0)
        const results = dpRunner.parse() // does not support cancellation
        reportProgress(100)

        return results
    }

    private throwUponCancellation(cancelToken: CancelToken): void {
        if (cancelToken.cancellationRequested) {
            throw new Error('Operation was cancelled')
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
                        resolve()
                    }
                }
            )
            cancelToken.emitter.on('cancel', async () => {
                console.log('DiscoPoPRunner::cancellation requested::CMAKE')
                childProcess.kill() // SIGINT or SIGTERM?
                outerResolve?.()
            })
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

export class DPRunnerUI {
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

    public async run() {
        const dpRunnerCMake = new DPRunnerCMake(
            this.projectDirectory,
            this.executableName,
            this.executableArguments,
            this.buildDirectory,
            this.dotDiscoPoP
        )

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Running DiscoPoP',
                cancellable: true,
            },
            async (progress, token) => {
                const cancelTokenWrapper: CancelToken = {
                    emitter: new EventEmitter(),
                    cancellationRequested: false,
                }
                cancelTokenWrapper.emitter.on('cancel', () => {
                    cancelTokenWrapper.cancellationRequested = true
                })
                const cancellationDisposable = token.onCancellationRequested(
                    () => {
                        cancelTokenWrapper.emitter.emit('cancel')
                    }
                )

                const reportMessageWrapper = (
                    message: string,
                    nesting: number
                ) => {
                    // all progress reports are logged to the console
                    console.log(
                        `DiscoPoPRunner: ${'-'.repeat(nesting)} ${message}`
                    )

                    // only top-level progress reports are shown in the UI
                    if (nesting === 0) {
                        progress.report({
                            message: message,
                        })
                    }
                }

                const reportProgressWrapper = (progressValue: number) => {
                    progress.report({
                        increment: progressValue,
                    })
                }

                const requestConfirmationWrapper = async (message: string) => {
                    return UIPrompts.actionConfirmed(message)
                }

                try {
                    await dpRunnerCMake.run(
                        reportMessageWrapper,
                        reportProgressWrapper,
                        requestConfirmationWrapper,
                        cancelTokenWrapper
                    )
                } catch (e: any) {
                    vscode.window.showErrorMessage(e.message || e)
                } finally {
                    cancellationDisposable.dispose()
                }
            }
        )
    }
}
