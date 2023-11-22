import { exec } from 'child_process'
import * as fs from 'fs'
import * as vscode from 'vscode'

import { Config } from '../Utils/Config'
import ErrorHandler from '../Utils/ErrorHandler'
import { UIPrompts } from '../Utils/UIPrompts'
import {
    WithProgressOperation,
    WithProgressRunner,
} from '../Utils/WithProgressRunner'

export interface DiscoPoPRunnerArguments {
    projectPath: string
    buildPath: string
    dotDiscoPoPPath: string
    executableName: string
    executableArguments: string
    buildArguments: string
}

export abstract class DiscoPoPRunner {
    private constructor() {
        throw new Error('This class cannot be instantiated.')
    }

    /**
     * Runs the full DiscoPoP pipeline.
     * @param runnerArgs the arguments for the run
     * @returns true if the run was completed successfully, false if the run was cancelled
     * @throws if the run failed
     */
    public static async run(
        runnerArgs: DiscoPoPRunnerArguments
    ): Promise<boolean> {
        const steps: WithProgressOperation[] = []

        steps.push({
            message: 'Checking setup...',
            increment: 0,
            operation: async () => {
                Config.checkDiscoPoPSetup()
            },
        })

        steps.push({
            message: 'Preparing build directory...',
            increment: 5,
            operation: async () => {
                await this._createBuildDirectory(runnerArgs.buildPath)
            },
        })

        steps.push({
            message: 'Running CMAKE...',
            increment: 10,
            operation: async (token) => {
                await this._runCMake(
                    runnerArgs.projectPath,
                    runnerArgs.buildPath,
                    token
                )
            },
        })

        steps.push({
            message: 'Running MAKE...',
            increment: 10,
            operation: async (token) => {
                await this._runMake(runnerArgs.buildPath, token)
            },
        })

        steps.push({
            message: 'Running executable...',
            increment: 20,
            operation: async (token) => {
                await this._runExecutable(
                    runnerArgs.buildPath,
                    runnerArgs.executableName,
                    runnerArgs.executableArguments,
                    token
                )
            },
        })

        steps.push({
            message: 'Running discopop_explorer...',
            increment: 45,
            operation: async (token) => {
                await this._runDiscopopExplorer(
                    runnerArgs.dotDiscoPoPPath,
                    token
                )
            },
        })

        steps.push({
            message: 'Generating patches...',
            increment: 10,
            operation: async (token) => {
                await this._generatePatches(runnerArgs.dotDiscoPoPPath, token)
            },
        })

        const withProgressRunner = new WithProgressRunner(
            'Running DiscoPoP',
            vscode.ProgressLocation.Notification,
            true,
            steps,
            ErrorHandler
        )

        return withProgressRunner.run()
    }

    /**
     * Creates the build directory if it does not exist yet.
     */
    private static async _createBuildDirectory(
        buildPath: string
    ): Promise<void> {
        if (!fs.existsSync(buildPath)) {
            fs.mkdirSync(buildPath, {
                recursive: true,
            })
        } else if (
            Config.skipOverwriteConfirmation() ||
            (await UIPrompts.actionConfirmed(
                'The build directory already exists. Do you want to overwrite it?\n(You can disable this dialog in the extension settings)'
            ))
        ) {
            fs.rmSync(buildPath, {
                recursive: true,
            })
            fs.mkdirSync(buildPath, {
                recursive: true,
            })
        } else {
            throw new Error('Operation cancelled by user')
        }
    }

    /**
     * Runs the cmake wrapper script.
     */
    private static async _runCMake(
        projectPath: string,
        buildPath: string,
        token: vscode.CancellationToken
    ): Promise<void> {
        const cmakeWrapperScript = `${Config.discopopBuild()}/scripts/CMAKE_wrapper.sh`
        let outerResolve: () => void
        return new Promise<void>((resolve, reject) => {
            outerResolve = resolve
            const childProcess = exec(
                `${cmakeWrapperScript} ${projectPath}`,
                { cwd: buildPath },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                'CMAKE failed: ' + err.message + '\n' + stderr
                            )
                        )
                    } else {
                        resolve()
                    }
                }
            )
            token.onCancellationRequested(async () => {
                console.log('DiscoPoPRunner::cancellation requested::CMAKE')
                await childProcess.kill() // SIGINT or SIGTERM?
                outerResolve?.()
            })
        })
    }

    /**
     * Runs make to build the project.
     */
    private static async _runMake(
        buildPath: string,
        token: vscode.CancellationToken
    ): Promise<void> {
        let outerResolve: () => void
        return new Promise<void>((resolve, reject) => {
            outerResolve = resolve
            const childProcess = exec(
                `make > make.log 2>&1`,
                { cwd: buildPath },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                'MAKE failed: ' + err.message + '\n' + stderr
                            )
                        )
                    } else {
                        resolve()
                    }
                }
            )
            token.onCancellationRequested(async () => {
                console.log('DiscoPoPRunner::cancellation requested::MAKE')
                await childProcess.kill() // SIGINT or SIGTERM?
                outerResolve?.()
            })
        })

        // // NOTE: we might want to remember this approach on how to automatically detect the executable name:
        // // parse the make log and look for "Linking CXX executable"
        // let autoDetectedExecutableName: string | undefined
        // const makeLog = fs.readFileSync(`${fullConfiguration.getBuildDirectory()}/make.log`, 'utf-8')
        // const regex = /Linking CXX executable ([a-zA-Z0-9_]+)/
        // const match = makeLog.match(regex)
        // if (match) {
        //    vscode.window.showInformationMessage("Executable name detected: " + match[1])
        //    autoDetectedExecutableName = match[1]
        // }
        // else {
        //    vscode.window.showErrorMessage("Could not automatically detect executable name.")
        // }
    }

    /**
     * Runs the executable.
     */
    private static async _runExecutable(
        buildPath: string,
        executableName: string,
        executableArgs: string,
        token: vscode.CancellationToken
    ): Promise<void> {
        let outerResolve: () => void
        return new Promise<void>((resolve, reject) => {
            outerResolve = resolve
            const childProcess = exec(
                `${buildPath}/${executableName} ${executableArgs || ''}`,
                { cwd: buildPath },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                'Executable failed: ' +
                                    err.message +
                                    '\n' +
                                    stderr
                            )
                        )
                        // TODO maybe it is acceptable for the executable to fail?
                    } else {
                        resolve()
                    }
                }
            )
            token.onCancellationRequested(async () => {
                console.log(
                    'DiscoPoPRunner::cancellation requested::executable'
                )
                await childProcess.kill() // SIGINT or SIGTERM?
                outerResolve?.()
            })
        })
    }

    /**
     * Runs discopop_explorer.
     */
    private static async _runDiscopopExplorer(
        dotDiscoPoP: string,
        cancelToken: vscode.CancellationToken
    ): Promise<void> {
        let outerResolve: () => void
        return new Promise<void>((resolve, reject) => {
            outerResolve = resolve
            const childProcess = exec(
                `discopop_explorer`,
                {
                    cwd: dotDiscoPoP,
                },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                'discopop_explorer failed: ' +
                                    err.message +
                                    '\n' +
                                    stderr
                            )
                        )
                    }
                    // TODO errors are not reliably reported? --> fix in discopop_explorer!
                    // for now: ensure that patterns.json was created
                    else if (
                        !fs.existsSync(`${dotDiscoPoP}/explorer/patterns.json`)
                    ) {
                        reject(
                            new Error(
                                'discopop_explorer failed: patterns.json was not created'
                            )
                        )
                    } else {
                        resolve()
                    }
                }
            )
            cancelToken.onCancellationRequested(async () => {
                console.log(
                    'DiscoPoPRunner::cancellation requested::discopop_explorer'
                )
                await childProcess.kill() // SIGINT or SIGTERM?
                outerResolve?.()
            })
        })
    }

    /**
     * Generates patches.
     */
    private static async _generatePatches(
        dotDiscoPoP: string,
        cancelToken: vscode.CancellationToken
    ): Promise<void> {
        // run like patch_generator like discopop_explorer
        let outerResolve: () => void
        return new Promise<void>((resolve, reject) => {
            outerResolve = resolve
            const childProcess = exec(
                `discopop_patch_generator --dp-build-path=${Config.discopopBuild()}`,
                {
                    cwd: dotDiscoPoP,
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
            cancelToken.onCancellationRequested(async () => {
                console.log(
                    'DiscoPoPRunner::cancellation requested::discopop_patch_generator'
                )
                await childProcess.kill() // SIGINT or SIGTERM?
                outerResolve?.()
            })
        })
    }
}
