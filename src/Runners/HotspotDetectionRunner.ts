import { exec } from 'child_process'
import * as fs from 'fs'
import * as vscode from 'vscode'
import { Config } from '../Utils/Config'
import { UIPrompts } from '../Utils/UIPrompts'
import {
    WithProgressOperation,
    WithProgressRunner,
} from '../Utils/WithProgressRunner'

export interface HotspotDetectionRunnerRunArguments {
    projectPath: string
    buildPath: string
    buildArguments: string
    dotDiscoPoP: string
    executableName: string
    executableArguments: string[]
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
                if (!fs.existsSync(args.buildPath)) {
                    fs.mkdirSync(args.buildPath, {
                        recursive: true,
                    })
                } else if (
                    Config.skipOverwriteConfirmation() ||
                    (await UIPrompts.actionConfirmed(
                        'The build directory already exists. Do you want to overwrite it?\n(You can disable this dialog in the extension settings)'
                    ))
                ) {
                    fs.rmSync(args.buildPath, {
                        recursive: true,
                    })
                    fs.mkdirSync(args.buildPath, {
                        recursive: true,
                    })
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
                        `${cmakeWrapperScript} ${args.projectPath}`,
                        {
                            cwd: args.buildPath,
                            env: {
                                ...process.env,
                                DOT_DISCOPOP: args.dotDiscoPoP,
                            },
                        },
                        (err, stdout, stderr) => {
                            if (err) {
                                reject(
                                    new Error('CMAKE failed: ' + err.message)
                                )
                            } else {
                                resolve()
                            }
                        }
                    )
                    token.onCancellationRequested(async () => {
                        console.log(
                            'HotspotDetectionRunner::cancellationRequested::CMAKE'
                        )
                        childProcess.kill() // SIGINT or SIGTERM?
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
                            cwd: args.buildPath,
                            env: {
                                ...process.env,
                                DOT_DISCOPOP: args.dotDiscoPoP,
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
                    token.onCancellationRequested(async () => {
                        console.log(
                            'HotspotDetectionRunner::cancellationRequested::MAKE'
                        )
                        childProcess.kill() // SIGINT or SIGTERM?
                        outerResolve?.()
                    })
                })
            },
        })

        args.executableArguments.forEach((execArgs, index) => {
            steps.push({
                message: `Running Executable... (${index + 1}/${
                    args.executableArguments.length
                })`,
                increment: 50 / args.executableArguments.length,
                operation: async (token) => {
                    let outerResolve: () => void
                    return new Promise<void>((resolve, reject) => {
                        outerResolve = resolve
                        const childProcess = exec(
                            `${args.buildPath}/${args.executableName} ${execArgs}`,
                            {
                                cwd: args.buildPath,
                                env: {
                                    ...process.env,
                                    DOT_DISCOPOP: args.dotDiscoPoP,
                                },
                            },
                            (err, stdout, stderr) => {
                                if (err) {
                                    reject(
                                        new Error(
                                            'Execution failed: ' + err.message
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
                                'HotspotDetectionRunner::cancellationRequested::Executable'
                            )
                            childProcess.kill() // SIGINT or SIGTERM?
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
                            cwd: args.dotDiscoPoP,
                        },
                        (err, stdout, stderr) => {
                            if (err) {
                                reject(
                                    new Error(
                                        'hotspot_analyzer failed: ' +
                                            err.message
                                    )
                                )
                            } else {
                                resolve()
                            }
                        }
                    )
                    token.onCancellationRequested(async () => {
                        console.log(
                            'HotspotDetectionRunner::cancellationRequested::hotspot_analyzer'
                        )
                        childProcess.kill() // SIGINT or SIGTERM?
                        outerResolve?.()
                    })
                })
            },
        })

        const withProgressRunner = new WithProgressRunner<typeof state>(
            'Running Hotspot Detection...',
            vscode.ProgressLocation.Notification,
            true,
            steps
        )

        return withProgressRunner.run()
    }
}
