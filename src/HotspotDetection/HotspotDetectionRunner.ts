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

    public static async runConfiguration(
        configuration: Configuration
    ): Promise<void> {
        const state = {
            configuration,
            fileMapping: undefined as FileMapping,
            hotspotDetectionResults: undefined as HotspotDetectionResults,
        }

        const step0a = {
            message: 'Gathering information...',
            increment: 0,
            operation: async (s: Partial<typeof state>) => {
                s.configuration = s.configuration.getFullConfiguration()
                return s
            },
        }

        const step0b = {
            message: 'Checking setup...',
            increment: 0,
            operation: async (s: Partial<typeof state>) => {
                Config.checkHotspotDetectionSetup()
                return s
            },
        }

        const step1 = {
            message: 'Preparing build directory...',
            increment: 5,
            operation: async (s: Partial<typeof state>) => {
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
                return s
            },
        }

        const step2 = {
            message: 'Running cmake...',
            increment: 10,
            operation: async (s: Partial<typeof state>) => {
                const cmakeWrapperScript = `${Config.hotspotDetectionBuild()}/scripts/CMAKE_wrapper.sh`
                return new Promise<Partial<typeof state>>((resolve, reject) => {
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
                                resolve(s)
                            }
                        }
                    )
                })
            },
        }

        const step3 = {
            message: 'Running make...',
            increment: 10,
            operation: async (s: Partial<typeof state>) => {
                return new Promise<Partial<typeof state>>((resolve, reject) => {
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
                                resolve(s)
                            }
                        }
                    )
                })
            },
        }

        const steps4: ProgressingOperation<typeof state>[] = []
        // TODO we need to get args from the configuration
        const hardcodedArgs = [
            'args 1 ...',
            'args 2 ...',
            'args 3 ...',
            'args 4 ...',
            'args 5 ...',
        ]

        hardcodedArgs.forEach((args, index) => {
            steps4.push({
                message: `Running Executable... (${index + 1}/${
                    hardcodedArgs.length
                })`,
                increment: 50 / hardcodedArgs.length,
                operation: async (s: Partial<typeof state>) => {
                    return new Promise<Partial<typeof state>>(
                        (resolve, reject) => {
                            exec(
                                `${s.configuration.getHotspotDetectionBuildDirectory()}/${s.configuration.getExecutableName()} ${args}`,
                                {
                                    cwd: s.configuration.getHotspotDetectionBuildDirectory(),
                                },
                                (err, stdout, stderr) => {
                                    console.log(stdout)
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
                                        resolve(s)
                                    }
                                }
                            )
                        }
                    )
                },
            })
        })

        const step5 = {
            message: 'Detecting Hotspots...',
            increment: 10,
            operation: async (s: Partial<typeof state>) => {
                return new Promise<Partial<typeof state>>((resolve, reject) => {
                    exec(
                        `hotspot_analyzer`,
                        {
                            cwd: `${configuration.getHotspotDetectionBuildDirectory()}/.discopop`,
                        },
                        (err, stdout, stderr) => {
                            console.log(stdout)
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
                                resolve(s)
                            }
                        }
                    )
                })
            },
        }

        const step6a = {
            message: 'Parsing results (FileMapping)...',
            increment: 5,
            operation: async (s: Partial<typeof state>) => {
                s.fileMapping = FileMappingParser.parseFile(
                    s.configuration.getHotspotDetectionBuildDirectory() +
                        '/.discopop/common_data/FileMapping.txt'
                )
                return s
            },
        }

        const step6b = {
            message: 'Parsing results (Hotspots)...',
            increment: 5,
            operation: async (s: Partial<typeof state>) => {
                s.hotspotDetectionResults = HotspotDetectionParser.parseFile(
                    s.configuration.getHotspotDetectionBuildDirectory() +
                        '/.discopop/hotspot_detection/Hotspots.json'
                )
                console.log(s.hotspotDetectionResults)
                return s
            },
        }

        const step7 = {
            message: 'Preparing results...',
            increment: 5,
            operation: async (s: Partial<typeof state>) => {
                // show the hotspots in the sidebar
                const hotspotTree = new HotspotTree(
                    s.fileMapping,
                    s.hotspotDetectionResults
                )
                await HotspotDetectionRunner.hotspotTreeDisposable?.dispose()
                HotspotDetectionRunner.hotspotTreeDisposable =
                    vscode.window.createTreeView('sidebar-hotspots-view', {
                        treeDataProvider: hotspotTree,
                        showCollapseAll: false,
                        canSelectMany: false,
                    })

                return s
            },
        }

        const operations: ProgressingOperation<typeof state>[] = [
            step0a,
            step0b,
            step1,
            step2,
            step3,
            ...steps4,
            step5,
            step6a,
            step6b,
            step7,
        ]

        const withProgressRunner = new WithProgressRunner<typeof state>(
            'Simulating Hotspot Detection', // TODO
            vscode.ProgressLocation.Notification,
            false, // TODO true is currently NOT supported
            operations,
            state,
            getDefaultErrorHandler('Hotspot Detection failed. ')
        )

        await withProgressRunner.run()
    }
}
