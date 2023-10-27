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
    SuggestionTree,
    DiscoPoPSuggestionTreeNode,
} from './DiscoPoPSuggestionTree'
import { FileMappingParser } from '../FileMapping/FileMappingParser'
import { SuggestionParser } from './SuggestionParser'
import { DiscoPoPCodeLensProvider } from './DiscoPoPCodeLensProvider'
import { FileMapping } from '../FileMapping/FileMapping'
import { DiscoPoPResults } from './classes/DiscoPoPResults'

export abstract class DiscoPoPRunner {
    private constructor() {
        throw new Error('This class cannot be instantiated.')
    }

    private static codeLensProviderDisposable: vscode.Disposable | undefined
    private static suggestionTreeDisposable:
        | vscode.TreeView<DiscoPoPSuggestionTreeNode>
        | undefined

    /**
     * Run DiscoPoP with the given configuration.
     * Will also present the results in the GUI.
     * @param configuration
     */
    public static async runConfiguration(configuration: Configuration) {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Running DiscoPoP',
                cancellable: false, // TODO we want to be able to cancel the process
            },
            async (progress, token) => {
                try {
                    // STEP 1: collect full configuration info
                    progress.report({
                        increment: 5,
                        message: 'Collecting configuration info...',
                    }) // 5% done
                    const fullConfiguration = await this._getFullConfiguration(
                        configuration
                    )

                    // STEP 2: create build directory
                    progress.report({
                        increment: 5,
                        message: 'Creating build directory...',
                    }) // 10% done
                    await this._createBuildDirectory(fullConfiguration)

                    // STEP 3: run cmake
                    progress.report({
                        increment: 15,
                        message: 'Running CMAKE...',
                    }) // 25% done
                    await this._runCMake(fullConfiguration)

                    // STEP 4: run make
                    progress.report({
                        increment: 15,
                        message: 'Running MAKE...',
                    }) // 40% done
                    await this._runMake(fullConfiguration)

                    // STEP 5: run the executable
                    progress.report({
                        increment: 20,
                        message: 'Running executable...',
                    }) // 60% done
                    await this._runExecutable(fullConfiguration)

                    // STEP 6: run discopop_explorer
                    progress.report({
                        increment: 30,
                        message: 'Running discopop_explorer...',
                    }) // 90% done
                    await this._runDiscopopExplorer(fullConfiguration)

                    // STEP 7a : parse the results (FileMapping)
                    progress.report({
                        increment: 3,
                        message: 'Parsing results...',
                    }) // 93% done
                    const fileMapping = FileMappingParser.parseFile(
                        `${fullConfiguration.getBuildDirectory()}/.discopop/FileMapping.txt`
                    )

                    // STEP 7b: parse the results (patterns.json
                    progress.report({
                        increment: 3,
                        message: 'Parsing results...',
                    }) // 96% done
                    const discoPoPResults = SuggestionParser.parseFile(
                        `${fullConfiguration.getBuildDirectory()}/.discopop/explorer/patterns.json`
                    )

                    // STEP 8: present the results
                    progress.report({
                        increment: 3,
                        message: 'Preparing views and code hints...',
                    }) // 99% done
                    await this._presentResults(fileMapping, discoPoPResults)

                    // DONE
                    progress.report({ increment: 1, message: 'Done!' }) // 100% done
                    // keep the notification open for 1 second
                    await new Promise((resolve) => setTimeout(resolve, 1000))
                } catch (error: unknown) {
                    console.log('DiscoPoP execution stopped:')
                    if (error instanceof Error) {
                        console.log(error.message)
                        console.log(error.stack)
                        vscode.window.showErrorMessage(
                            `DiscoPoP execution stopped: ` + error.message
                        )
                    } else {
                        console.log(error)
                        vscode.window.showErrorMessage(
                            `DiscoPoP execution stopped with unknown error`
                        )
                    }
                    // TODO should we do some cleanup? but then again, the user might want to inspect the results
                }
            }
        )
    }

    /**
     * Returns a full (runnable) configuration, i.e. a DefaultConfiguration,
     * by combining the given configuration with its default configuration.
     *
     * If the provided configuration is already a DefaultConfiguration, it is returned as is.
     */
    private static async _getFullConfiguration(
        configuration: Configuration
    ): Promise<DefaultConfiguration> {
        if (configuration instanceof DefaultConfiguration) {
            return configuration
        }

        const defaults = configuration.getParent().getDefaultConfiguration()
        const combined = new DefaultConfiguration(
            configuration.getProjectPath() ?? defaults.getProjectPath(),
            configuration.getExecutableName() ?? defaults.getExecutableName(),
            configuration.getExecutableArguments() ??
                defaults.getExecutableArguments(),
            configuration.getBuildDirectory() ?? defaults.getBuildDirectory(),
            configuration.getName() ?? defaults.getName()
        )

        combined.setName(configuration.getName())

        return combined
    }

    /**
     * Creates the build directory if it does not exist yet.
     */
    private static async _createBuildDirectory(
        configuration: DefaultConfiguration
    ): Promise<void> {
        if (!fs.existsSync(configuration.getBuildDirectory())) {
            fs.mkdirSync(configuration.getBuildDirectory())
        } else {
            if (
                await UIPrompts.actionConfirmed(
                    'The build directory already exists. Do you want to overwrite it?'
                )
            ) {
                fs.rmSync(configuration.getBuildDirectory(), {
                    recursive: true,
                })
                fs.mkdirSync(configuration.getBuildDirectory())
            } else {
                throw new Error('Operation cancelled by user')
            }
        }
    }

    /**
     * Runs the cmake wrapper script.
     */
    private static async _runCMake(
        configuration: DefaultConfiguration
    ): Promise<void> {
        const cmakeWrapperScript = `${Config.discopopBuild}/scripts/CMAKE_wrapper.sh`
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
                    configuration.getExecutableArguments()
                        ? configuration.getExecutableArguments()
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
                `python3 -m discopop_explorer`, //--fmap ${fullConfiguration.getBuildDirectory()}/FileMapping.txt --path ${fullConfiguration.getBuildDirectory()} --dep-file ${fullConfiguration.getBuildDirectory()}/${fullConfiguration.getExecutableName()}_dep.txt --json patterns.json`,
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
     * Presents the results.
     */
    private static async _presentResults(
        fileMapping: FileMapping,
        discoPoPResults: DiscoPoPResults
    ): Promise<void> {
        // show the suggestions in the sidebar
        const suggestionTree = new SuggestionTree(fileMapping, discoPoPResults)
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
