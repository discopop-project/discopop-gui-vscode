import * as vscode from 'vscode'
import * as fs from 'fs'
import { UIPrompts } from '../Utils/UIPrompts'
import { Configuration } from '../ProjectManager/Configuration'
import {
    ProgressingOperation,
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
        args: HotspotDetectionRunnerRunArguments & HotspotDetectionRunnerParseArguments
    ): Promise<HotspotDetectionRunnerResults> {
        await HotspotDetectionRunner.run(args)
        return HotspotDetectionRunner.parse(args)
    }

    public static async run(args: HotspotDetectionRunnerRunArguments) {
        const state:undefined = undefined
        const steps: ProgressingOperation<typeof state>[] = []

        steps.push({
            message: 'Checking setup...',
            increment: 0,
            operation: async (_) => {
                Config.checkHotspotDetectionSetup()
            },
        })

        steps.push({
            message: 'Preparing build directory...',
            increment: 5,
            operation: async (_) => {
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
            operation: async (s) => {
                const cmakeWrapperScript = `${Config.hotspotDetectionBuild()}/scripts/CMAKE_wrapper.sh`
                return new Promise<void>((resolve, reject) => {
                    exec(
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
                })
            },
        })

        steps.push({
            message: 'Running make...',
            increment: 10,
            operation: async (s) => {
                return new Promise<void>((resolve, reject) => {
                    exec(
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
                })
            },
        })

        // TODO we need to get args from the configuration
        const executable_args =
            args.configuration.getExecutableArgumentsHotspotDetection()

        executable_args.forEach((execArgs, index) => {
            steps.push({
                message: `Running Executable... (${index + 1}/${
                    executable_args.length
                })`,
                increment: 50 / executable_args.length,
                operation: async (s) => {
                    return new Promise<void>((resolve, reject) => {
                        exec(
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
                    })
                },
            })
        })

        steps.push({
            message: 'Detecting Hotspots...',
            increment: 10,
            operation: async (s) => {
                return new Promise<void>((resolve, reject) => {
                    exec(
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
                })
            },
        })

        const withProgressRunner = new WithProgressRunner<typeof state>(
            'Running Hotspot Detection...',
            vscode.ProgressLocation.Notification,
            false, // TODO true is currently NOT supported
            steps,
            state,
            getDefaultErrorHandler('Hotspot Detection failed. ')
        )

        await withProgressRunner.run()
    }

    public static async parse(args: HotspotDetectionRunnerParseArguments): Promise<HotspotDetectionRunnerResults> {
        const state = {
            results: {} as Partial<HotspotDetectionRunnerResults>,
        }
        const steps: ProgressingOperation<typeof state>[] = []

        steps.push({
            message: 'Parsing results (FileMapping)...',
            increment: 5,
            operation: async (s) => {
                s.results.fileMapping = FileMappingParser.parseFile(
                    args.configuration.getHotspotDetectionBuildDirectory() +
                        '/.discopop/common_data/FileMapping.txt'
                )
            },
        })

        steps.push({
            message: 'Parsing results (Hotspots)...',
            increment: 5,
            operation: async (s) => {
                s.results.hotspotDetectionResults = HotspotDetectionParser.parseFile(
                    args.configuration.getHotspotDetectionBuildDirectory() +
                        '/.discopop/hotspot_detection/Hotspots.json'
                )
            },
        })

        // TODO make sure the numbers add up to 100 in both run and parse functions
        // better even: normalize in the WithProgressRunner!
        
        const withProgressRunner = new WithProgressRunner<typeof state>(
            'Parsing Hotspot Detection Results...',
            vscode.ProgressLocation.Notification,
            false, // TODO true is currently NOT supported
            steps,
            state,
            getDefaultErrorHandler('Hotspot Detection failed. ')
        )

        await withProgressRunner.run()
        return state.results as HotspotDetectionRunnerResults
    }
}
