import * as vscode from 'vscode'
import * as fs from 'fs'
import { UIPrompts } from '../Utils/UIPrompts'
import { Configuration } from '../ProjectManager/Configuration'
import {
    WithProgressOperation,
    WithProgressRunner,
} from '../Utils/WithProgressRunner'
import { getDefaultErrorHandler } from '../Utils/ErrorHandler'
import { exec } from 'child_process'
import { Config } from '../Utils/Config'
import { FileMappingParser } from '../FileMapping/FileMappingParser'
import { FileMapping } from '../FileMapping/FileMapping'
import { HotspotDetectionResults } from './HotspotDetectionResults'
import { HotspotDetectionParser } from './HotspotDetectionParser'
import { HotspotTree } from './HotspotTree'

export interface HotspotDetectionRunnerRunArguments {
    configuration: Configuration // TODO only the relevent properties
}

export interface HotspotDetectionRunnerParseArguments {
    configuration: Configuration // TODO only the relevent properties
}

export interface HotspotDetectionRunnerResults {
    fileMapping: FileMapping
    hotspotDetectionResults: HotspotDetectionResults
}

export abstract class HotspotDetectionRunner {
    private constructor() {
        throw new Error('This class cannot be instantiated')
    }

    public static async runAndParse(
        args: HotspotDetectionRunnerRunArguments &
            HotspotDetectionRunnerParseArguments
    ): Promise<HotspotDetectionRunnerResults> {
        const runningFinishedSuccessfully = await HotspotDetectionRunner.run(
            args
        )
        return runningFinishedSuccessfully
            ? HotspotDetectionRunner.parse(args)
            : Promise.reject(new Error('Hotspot Detection was cancelled.'))
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
            getDefaultErrorHandler('Hotspot Detection failed. ')
        )

        return withProgressRunner.run()
    }

    public static async parse(
        args: HotspotDetectionRunnerParseArguments
    ): Promise<HotspotDetectionRunnerResults> {
        const steps: WithProgressOperation[] = []

        let fileMapping: FileMapping | undefined = undefined
        let hotspotDetectionResults: HotspotDetectionResults | undefined =
            undefined

        steps.push({
            message: 'Parsing results (FileMapping)...',
            increment: 5,
            operation: async () => {
                fileMapping = FileMappingParser.parseFile(
                    args.configuration.getHotspotDetectionBuildDirectory() +
                        '/.discopop/common_data/FileMapping.txt'
                )
            },
        })

        steps.push({
            message: 'Parsing results (Hotspots)...',
            increment: 5,
            operation: async () => {
                hotspotDetectionResults = HotspotDetectionParser.parseFile(
                    args.configuration.getHotspotDetectionBuildDirectory() +
                        '/.discopop/hotspot_detection/Hotspots.json'
                )
            },
        })

        // TODO make sure the numbers add up to 100 in both run and parse functions
        // better even: normalize in the WithProgressRunner!

        const withProgressRunner = new WithProgressRunner(
            'Parsing Hotspot Detection Results...',
            vscode.ProgressLocation.Notification,
            false, // TODO true is currently NOT supported
            steps,
            getDefaultErrorHandler('Hotspot Detection failed. ')
        )

        await withProgressRunner.run()
        return {
            fileMapping: fileMapping!,
            hotspotDetectionResults: hotspotDetectionResults!,
        }
    }
}
