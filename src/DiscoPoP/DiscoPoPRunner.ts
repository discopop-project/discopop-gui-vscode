import * as vscode from 'vscode'
import * as fs from 'fs'
import { exec } from 'child_process'

import { Config } from '../Utils/Config'
import {
    Configuration,
    DefaultConfiguration,
} from '../ProjectManager/Configuration'
import { UIPrompts } from '../Utils/UIPrompts'
import {
    DiscoPoPSuggestionGroup,
    DiscoPoPSuggestionNode,
    SuggestionTree,
} from './DiscoPoPSuggestionTree'
import { FileMappingParser } from '../FileMapping/FileMappingParser'
import { DiscoPoPParser } from './DiscoPoPParser'
import { DiscoPoPCodeLensProvider } from './DiscoPoPCodeLensProvider'
import { FileMapping } from '../FileMapping/FileMapping'
import { DiscoPoPResults } from './classes/DiscoPoPResults'
import { WithProgressRunner } from '../Utils/WithProgressRunner'
import { getDefaultErrorHandler } from '../Utils/ErrorHandler'
import { LineMapping } from './LineMapping'

export abstract class DiscoPoPRunner {
    private constructor() {
        throw new Error('This class cannot be instantiated.')
    }

    private static codeLensProviderDisposable: vscode.Disposable | undefined
    private static suggestionTreeDisposable:
        | vscode.TreeView<DiscoPoPSuggestionNode | DiscoPoPSuggestionGroup>
        | undefined

    /**
     * Run DiscoPoP with the given configuration.
     * Will also present the results in the GUI.
     * @param configuration
     */
    public static async runConfiguration(configuration: Configuration) {
        const state = {
            configuration: configuration,
            fullConfiguration: undefined,
            fileMapping: undefined,
            discoPoPResults: undefined,
            lineMapping: undefined,
        }

        const step1a = {
            message: 'Collecting configuration info...',
            increment: 0,
            operation: async (state) => {
                state.fullConfiguration = configuration.getFullConfiguration()
                return state
            },
        }

        const step1b = {
            message: 'Checking setup...',
            increment: 0,
            operation: async (state) => {
                Config.checkDiscoPoPSetup()
                return state
            },
        }

        const step2 = {
            message: 'Preparing build directory...',
            increment: 5,
            operation: async (state) => {
                await this._createBuildDirectory(state.fullConfiguration)
                return state
            },
        }

        const step3 = {
            message: 'Running CMAKE...',
            increment: 10,
            operation: async (state) => {
                await this._runCMake(state.fullConfiguration)
                return state
            },
        }

        const step4 = {
            message: 'Running MAKE...',
            increment: 10,
            operation: async (state) => {
                await this._runMake(state.fullConfiguration)
                return state
            },
        }

        const step5 = {
            message: 'Running executable...',
            increment: 15,
            operation: async (state) => {
                await this._runExecutable(state.fullConfiguration)
                return state
            },
        }

        const step6 = {
            message: 'Running discopop_explorer...',
            increment: 45,
            operation: async (state) => {
                await this._runDiscopopExplorer(state.fullConfiguration)
                return state
            },
        }

        const step7 = {
            // TODO 7
            message: 'Generating patches...',
            increment: 5,
            operation: async (state) => {
                await this._generatePatches(state.fullConfiguration)
                return state
            },
        }

        const step8 = {
            message: 'Parsing results (FileMapping)...',
            increment: 3,
            operation: async (state) => {
                state.fileMapping = FileMappingParser.parseFile(
                    `${state.fullConfiguration.getBuildDirectory()}/.discopop/FileMapping.txt`
                )
                return state
            },
        }

        const step9 = {
            message: 'Parsing results (Suggestions)...',
            increment: 3,
            operation: async (state) => {
                state.discoPoPResults = DiscoPoPParser.parseFile(
                    `${state.fullConfiguration.getBuildDirectory()}/.discopop/explorer/patterns.json`
                )
                return state
            },
        }

        const step9b = {
            message: 'watching for line_mapping.json changes...',
            increment: 1,
            operation: async (state) => {
                const lineMappingFile = `${state.fullConfiguration.getBuildDirectory()}/.discopop/line_mapping.json`
                state.lineMapping = new LineMapping(lineMappingFile)
                return state
            },
        }

        const step10 = {
            message: 'Preparing views and code hints...',
            increment: 3,
            operation: async (state) => {
                await this._presentResults(
                    state.fileMapping,
                    state.lineMapping,
                    state.discoPoPResults,
                    state.fullConfiguration
                )
                return state
            },
        }

        const withProgressRunner = new WithProgressRunner<typeof state>(
            'Running DiscoPoP...',
            vscode.ProgressLocation.Notification,
            false, // TODO: true is currently NOT supported
            [
                // TODO refactor const steps = []; steps.push(...) // otherwise it is easy to forget to add a step here
                step1a,
                step1b,
                step2,
                step3,
                step4,
                step5,
                step6,
                step7,
                step8,
                step9,
                step9b,
                step10,
            ],
            state,
            getDefaultErrorHandler('DiscoPoP failed. ')
        )

        await withProgressRunner.run()
    }

    /**
     * Creates the build directory if it does not exist yet.
     */
    private static async _createBuildDirectory(
        configuration: DefaultConfiguration
    ): Promise<void> {
        if (!fs.existsSync(configuration.getBuildDirectory())) {
            fs.mkdirSync(configuration.getBuildDirectory(), { recursive: true })
        } else if (
            Config.skipOverwriteConfirmation() ||
            (await UIPrompts.actionConfirmed(
                'The build directory already exists. Do you want to overwrite it?\n(You can disable this dialog in the extension settings)'
            ))
        ) {
            fs.rmSync(configuration.getBuildDirectory(), { recursive: true })
            fs.mkdirSync(configuration.getBuildDirectory(), { recursive: true })
        } else {
            throw new Error('Operation cancelled by user')
        }
    }

    /**
     * Runs the cmake wrapper script.
     */
    private static async _runCMake(
        configuration: DefaultConfiguration
    ): Promise<void> {
        const cmakeWrapperScript = `${Config.discopopBuild()}/scripts/CMAKE_wrapper.sh`
        return new Promise<void>((resolve, reject) => {
            exec(
                `${cmakeWrapperScript} ${configuration.getProjectPath()}`,
                { cwd: configuration.getBuildDirectory() },
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
        })
    }

    /**
     * Runs make to build the project.
     */
    private static async _runMake(
        configuration: DefaultConfiguration
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            exec(
                `make > make.log 2>&1`,
                { cwd: configuration.getBuildDirectory() },
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
        configuration: DefaultConfiguration
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            exec(
                `${configuration.getBuildDirectory()}/${configuration.getExecutableName()} ${
                    configuration.getExecutableArgumentsDiscoPoP()
                        ? configuration.getExecutableArgumentsDiscoPoP()
                        : ''
                }`,
                { cwd: configuration.getBuildDirectory() },
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
        })
    }

    /**
     * Runs discopop_explorer.
     */
    private static async _runDiscopopExplorer(
        configuration: DefaultConfiguration
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            exec(
                `discopop_explorer`,
                { cwd: `${configuration.getBuildDirectory()}/.discopop` },
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
                        !fs.existsSync(
                            `${configuration.getBuildDirectory()}/.discopop/explorer/patterns.json`
                        )
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
        })
    }

    /**
     * Generates patches.
     */
    private static async _generatePatches(
        configuration: DefaultConfiguration
    ): Promise<void> {
        // run like patch_generator like discopop_explorer
        return new Promise<void>((resolve, reject) => {
            exec(
                `discopop_patch_generator`,
                { cwd: `${configuration.getBuildDirectory()}/.discopop` },
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
        })
    }

    /**
     * Presents the results.
     */
    private static async _presentResults(
        fileMapping: FileMapping,
        lineMapping: LineMapping,
        discoPoPResults: DiscoPoPResults,
        fullConfiguration: DefaultConfiguration
    ): Promise<void> {
        // show the suggestions in the sidebar
        const suggestionTree = new SuggestionTree(fileMapping, discoPoPResults) // TODO use lineMapping here
        await DiscoPoPRunner.suggestionTreeDisposable?.dispose()
        DiscoPoPRunner.suggestionTreeDisposable = vscode.window.createTreeView(
            'sidebar-suggestions-view',
            {
                treeDataProvider: suggestionTree,
                showCollapseAll: false,
                canSelectMany: false,
            }
        )

        // enable code lenses for all suggestions
        const codeLensProvider = new DiscoPoPCodeLensProvider(
            fileMapping,
            lineMapping,
            fullConfiguration,
            discoPoPResults.getAllSuggestions()
        )
        await DiscoPoPRunner.codeLensProviderDisposable?.dispose()
        DiscoPoPRunner.codeLensProviderDisposable =
            vscode.languages.registerCodeLensProvider(
                { scheme: 'file', language: 'cpp' },
                codeLensProvider
            )
    }
}
