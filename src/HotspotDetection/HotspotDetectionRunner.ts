import { exec } from 'child_process'
import * as fs from 'fs'
import * as vscode from 'vscode'
import { CMakeConfiguration } from '../ProjectManager/Configuration'
import { Config } from '../Utils/Config'
import ErrorHandler from '../Utils/ErrorHandler'
import { UIPrompts } from '../Utils/UIPrompts'
import {
    WithProgressOperation,
    WithProgressRunner,
} from '../Utils/WithProgressRunner'

export interface HotspotDetectionRunnerRunArguments {
    configuration: CMakeConfiguration // TODO only the relevent properties
}

export abstract class HotspotDetectionRunner {
    private constructor() {
        throw new Error('This class cannot be instantiated')
    }

    public static async run(
        args: HotspotDetectionRunnerRunArguments
    ): Promise<boolean> {
        const state: undefined = undefined
        const steps: WithProgressOperation[] = []

        steps.push({
            message: 'Checking setup...',
            increment: 0,
            operation: async () => {
                Config.checkHotspotDetectionSetup()
            },
        })

        steps.push({
            message: 'Preparing build directory...',
            increment: 5,
            operation: async () => {
                if (
                    !fs.existsSync(
                        args.configuration.getHotspotDetectionBuildDirectory()
                    )
                ) {
                    fs.mkdirSync(
                        args.configuration.getHotspotDetectionBuildDirectory(),
                        { recursive: true }
                    )
                } else if (
                    Config.skipOverwriteConfirmation() ||
                    (await UIPrompts.actionConfirmed(
                        'The build directory already exists. Do you want to overwrite it?\n(You can disable this dialog in the extension settings)'
                    ))
                ) {
                    fs.rmSync(
                        args.configuration.getHotspotDetectionBuildDirectory(),
                        { recursive: true }
                    )
                    fs.mkdirSync(
                        args.configuration.getHotspotDetectionBuildDirectory(),
                        { recursive: true }
                    )
                } else {
                    throw new Error('Operation cancelled by user')
                }
            },
        })

        steps.push({
            message: 'Running cmake...',
            increment: 10,
            operation: async (token) => {
                const cmakeWrapperScript = `${Config.hotspotDetectionBuild()}/scripts/CMAKE_wrapper.sh`
                let outerResolve: () => void
                return new Promise<void>((resolve, reject) => {
                    outerResolve = resolve
                    const childProcess = exec(
                        `${cmakeWrapperScript} ${args.configuration.getProjectPath()}`,
                        {
                            cwd: args.configuration.getHotspotDetectionBuildDirectory(),
                        },
                        (err, stdout, stderr) => {
                            if (err) {
                                reject(
                                    new Error(
                                        'CMAKE failed: ' +
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
                    token.onCancellationRequested(async () => {
                        console.log(
                            'HotspotDetectionRunner::cancellation requested::CMAKE'
                        )
                        await childProcess.kill() // SIGINT or SIGTERM?
                        outerResolve?.()
                    })
                })
            },
        })

        steps.push({
            message: 'Running make...',
            increment: 10,
            operation: async (token) => {
                let outerResolve: () => void
                return new Promise<void>((resolve, reject) => {
                    outerResolve = resolve
                    const childProcess = exec(
                        `make > make.log 2>&1`,
                        {
                            cwd: args.configuration.getHotspotDetectionBuildDirectory(),
                        },
                        (err, stdout, stderr) => {
                            if (err) {
                                reject(
                                    new Error(
                                        'MAKE failed: ' +
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
                    token.onCancellationRequested(async () => {
                        console.log(
                            'HotspotDetectionRunner::cancellation requested::MAKE'
                        )
                        await childProcess.kill() // SIGINT or SIGTERM?
                        outerResolve?.()
                    })
                })
            },
        })

        const executable_args =
            args.configuration.getExecutableArgumentsHotspotDetection()

        executable_args.forEach((execArgs, index) => {
            steps.push({
                message: `Running Executable... (${index + 1}/${
                    executable_args.length
                })`,
                increment: 50 / executable_args.length,
                operation: async (token) => {
                    let outerResolve: () => void
                    return new Promise<void>((resolve, reject) => {
                        outerResolve = resolve
                        const childProcess = exec(
                            `${args.configuration.getHotspotDetectionBuildDirectory()}/${args.configuration.getExecutableName()} ${execArgs}`,
                            {
                                cwd: args.configuration.getHotspotDetectionBuildDirectory(),
                            },
                            (err, stdout, stderr) => {
                                if (err) {
                                    reject(
                                        new Error(
                                            'Hotspot Detection failed: ' +
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
                                'HotspotDetectionRunner::cancellation requested::Executable'
                            )
                            await childProcess.kill() // SIGINT or SIGTERM?
                            outerResolve?.()
                        })
                    })
                },
            })
        })

        steps.push({
            message: 'Detecting Hotspots...',
            increment: 10,
            operation: async (token) => {
                let outerResolve: () => void
                return new Promise<void>((resolve, reject) => {
                    outerResolve = resolve
                    const childProcess = exec(
                        `hotspot_analyzer`,
                        {
                            cwd: `${args.configuration.getHotspotDetectionBuildDirectory()}/.discopop`,
                        },
                        (err, stdout, stderr) => {
                            if (err) {
                                reject(
                                    new Error(
                                        'hotspot_analyzer failed: ' +
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
                    token.onCancellationRequested(async () => {
                        console.log(
                            'HotspotDetectionRunner::cancellation requested::hotspot_analyzer'
                        )
                        await childProcess.kill() // SIGINT or SIGTERM?
                        outerResolve?.()
                    })
                })
            },
        })

        const withProgressRunner = new WithProgressRunner<typeof state>(
            'Running Hotspot Detection...',
            vscode.ProgressLocation.Notification,
            true,
            steps,
            ErrorHandler
        )

        return withProgressRunner.run()
    }
}
