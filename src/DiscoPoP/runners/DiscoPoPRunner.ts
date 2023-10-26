import * as vscode from 'vscode'
import * as fs from 'fs'
import { exec } from 'child_process'

import { Config } from '../../Config'
import {
    Configuration,
    DefaultConfiguration,
} from '../../ProjectManager/Configuration'
import { UIPrompts } from '../../UIPrompts'
import { SuggestionTree, SuggestionTreeNode } from '../../SuggestionTree'
import { FileMappingParser } from '../parsers/FileMappingParser'
import { SuggestionParser } from '../parsers/SuggestionParser'
import { DiscoPoPCodeLensProvider } from '../../CodeLensProvider'

export abstract class DiscoPoPRunner {
    private constructor() {
        throw new Error('This class cannot be instantiated.')
    }

    private static codeLensProviderDisposable: vscode.Disposable | undefined
    private static suggestionTreeDisposable:
        | vscode.TreeView<SuggestionTreeNode>
        | undefined

    static async runConfiguration(configuration: Configuration) {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Running DiscoPoP',
                cancellable: false, // TODO we want to be able to cancel the process
            },
            async (progress, token) => {
                // TODO abort and show error if any of the steps fails
                // maybe it is sufficient to just have the steps reject their promises with a decent error message
                // then try-catch the whole thing here and show the error message

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
                progress.report({ increment: 15, message: 'Running CMAKE...' }) // 25% done
                await this._runCMake(fullConfiguration)

                // STEP 4: run make
                progress.report({ increment: 15, message: 'Running MAKE...' }) // 40% done
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
                progress.report({ increment: 3, message: 'Parsing results...' }) // 93% done
                const fileMapping = FileMappingParser.parseFile(
                    `${fullConfiguration.getBuildDirectory()}/.discopop/FileMapping.txt`
                )

                // STEP 7b: parse the results (patterns.json
                progress.report({ increment: 3, message: 'Parsing results...' }) // 96% done
                const discoPoPResults = SuggestionParser.parseFile(
                    `${fullConfiguration.getBuildDirectory()}/.discopop/explorer/patterns.json`
                )

                // STEP 8: show the results
                progress.report({
                    increment: 3,
                    message: 'Preparing views and code hints...',
                }) // 99% done

                // show the suggestions in the sidebar
                const suggestionTree = new SuggestionTree(
                    fileMapping,
                    discoPoPResults
                )
                await DiscoPoPRunner.suggestionTreeDisposable?.dispose()
                DiscoPoPRunner.suggestionTreeDisposable =
                    vscode.window.createTreeView('sidebar-suggestions-view', {
                        treeDataProvider: suggestionTree,
                        showCollapseAll: false,
                        canSelectMany: false,
                    })

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

                // DONE
                progress.report({ increment: 1, message: 'Done!' }) // 100% done
                // keep the notification open for 1 second
                await new Promise((resolve) => setTimeout(resolve, 1000))
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
                vscode.window.showInformationMessage('Aborting...')
                return
            }
        }
    }

    /**
     * Runs the cmake wrapper script.
     */
    private static async _runCMake(
        configuration: DefaultConfiguration
    ): Promise<void> {
        const cmakeWrapperScript = `${Config.discopopRoot}/build/scripts/CMAKE_wrapper.sh`
        return new Promise<void>((resolve, reject) => {
            exec(
                `${cmakeWrapperScript} ${configuration.getProjectPath()}`,
                { cwd: configuration.getBuildDirectory() },
                (err, stdout, stderr) => {
                    if (err) {
                        console.log(`error: ${err.message}`)
                        vscode.window.showErrorMessage(
                            `CMAKE wrapper script failed with error message ${err.message}`
                        )
                        reject()
                        return
                    }
                    resolve()
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
                        console.log(`error: ${err.message}`)
                        vscode.window.showErrorMessage(
                            `Make failed with error message ${err.message}`
                        )
                        reject()
                        return
                    }
                    resolve()
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
                        console.log(`error: ${err.message}`)
                        vscode.window.showErrorMessage(
                            `Executable failed with error message ${err.message}`
                        )
                        reject()
                        return
                    }
                    resolve()
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
                        console.log(`error: ${err.message}`)
                        console.log(`stdout: ${stdout}`)
                        console.log(`stderr: ${stderr}`)
                        vscode.window.showErrorMessage(
                            `Discopop_explorer failed with error message ${err.message}`
                        )
                        reject()
                    }
                    // TODO errors are not reliably reported? --> fix in discopop_explorer!
                    // for now: ensure that patterns.json was created
                    if (
                        !fs.existsSync(
                            `${configuration.getBuildDirectory()}/.discopop/explorer/patterns.json`
                        )
                    ) {
                        reject()
                    }
                    resolve()
                }
            )
        })
    }
}
