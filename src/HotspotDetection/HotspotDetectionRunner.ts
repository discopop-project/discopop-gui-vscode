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

export interface HotspotDetectionRunnerRunArguments {
    projectPath: string
    buildPath: string
    buildArguments: string
    dotDiscoPoPPath: string
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
                    fs.mkdirSync(args.buildPath, { recursive: true })
                } else if (
                    Config.skipOverwriteConfirmation() ||
                    (await UIPrompts.actionConfirmed(
                        'The build directory already exists. Do you want to overwrite it?\n(You can disable this dialog in the extension settings)'
                    ))
                ) {
                    fs.rmSync(args.buildPath, { recursive: true })
                    fs.mkdirSync(args.buildPath, { recursive: true })
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
                            cwd: args.buildPath,
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
                            cwd: args.dotDiscoPoPPath,
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
