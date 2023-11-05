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

export abstract class HotspotDetectionRunner {
    static hotspotTreeDisposable: any
    private constructor() {
        throw new Error('This class cannot be instantiated')
    }

    // TODO same structure as in DiscoPoPRunner
    public static async runConfiguration(
        configuration: Configuration
    ): Promise<void> {
        const state = {
            configuration: configuration.getFullConfiguration(),
            fileMapping: undefined as FileMapping,
            hotspotDetectionResults: undefined as HotspotDetectionResults,
        }

        const steps: ProgressingOperation<typeof state>[] = []

        steps.push({
            message: 'Checking setup...',
            increment: 0,
            operation: async (s) => {
                Config.checkHotspotDetectionSetup()
            },
        })

        steps.push({
            message: 'Preparing build directory...',
            increment: 5,
            operation: async (s) => {
                if (
                    !fs.existsSync(
                        s.configuration.getHotspotDetectionBuildDirectory()
                    )
                ) {
                    fs.mkdirSync(
                        s.configuration.getHotspotDetectionBuildDirectory(),
                        { recursive: true }
                    )
                } else if (
                    Config.skipOverwriteConfirmation() ||
                    (await UIPrompts.actionConfirmed(
                        'The build directory already exists. Do you want to overwrite it?\n(You can disable this dialog in the extension settings)'
                    ))
                ) {
                    fs.rmSync(
                        s.configuration.getHotspotDetectionBuildDirectory(),
                        { recursive: true }
                    )
                    fs.mkdirSync(
                        s.configuration.getHotspotDetectionBuildDirectory(),
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
                        `${cmakeWrapperScript} ${s.configuration.getProjectPath()}`,
                        {
                            cwd: s.configuration.getHotspotDetectionBuildDirectory(),
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
                            cwd: s.configuration.getHotspotDetectionBuildDirectory(),
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
            state.configuration.getExecutableArgumentsHotspotDetection()

        executable_args.forEach((args, index) => {
            steps.push({
                message: `Running Executable... (${index + 1}/${
                    executable_args.length
                })`,
                increment: 50 / executable_args.length,
                operation: async (s) => {
                    return new Promise<void>((resolve, reject) => {
                        exec(
                            `${s.configuration.getHotspotDetectionBuildDirectory()}/${s.configuration.getExecutableName()} ${args}`,
                            {
                                cwd: s.configuration.getHotspotDetectionBuildDirectory(),
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
                            cwd: `${configuration.getHotspotDetectionBuildDirectory()}/.discopop`,
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

        steps.push({
            message: 'Parsing results (FileMapping)...',
            increment: 5,
            operation: async (s) => {
                s.fileMapping = FileMappingParser.parseFile(
                    s.configuration.getHotspotDetectionBuildDirectory() +
                        '/.discopop/common_data/FileMapping.txt'
                )
            },
        })

        steps.push({
            message: 'Parsing results (Hotspots)...',
            increment: 5,
            operation: async (s) => {
                s.hotspotDetectionResults = HotspotDetectionParser.parseFile(
                    s.configuration.getHotspotDetectionBuildDirectory() +
                        '/.discopop/hotspot_detection/Hotspots.json'
                )
            },
        })

        steps.push({
            message: 'Preparing results...',
            increment: 5,
            operation: async (s) => {
                // show the hotspots in the sidebar
                const hotspotTree = new HotspotTree(
                    s.fileMapping,
                    undefined, // TODO s.lineMapping,
                    s.hotspotDetectionResults
                )
                await HotspotDetectionRunner.hotspotTreeDisposable?.dispose()
                HotspotDetectionRunner.hotspotTreeDisposable =
                    vscode.window.createTreeView('sidebar-hotspots-view', {
                        treeDataProvider: hotspotTree,
                        showCollapseAll: false,
                        canSelectMany: false,
                    })
            },
        })

        const withProgressRunner = new WithProgressRunner<typeof state>(
            'Simulating Hotspot Detection', // TODO
            vscode.ProgressLocation.Notification,
            false, // TODO true is currently NOT supported
            steps,
            state,
            getDefaultErrorHandler('Hotspot Detection failed. ')
        )

        await withProgressRunner.run()
    }
}
