import * as vscode from 'vscode'
import { Config } from '../../Config'
import * as fs from 'fs'
import { exec } from 'child_process'
import {
    Configuration,
    DefaultConfiguration,
} from '../../ProjectManager/Configuration'
import { UIPrompts } from '../../UIPrompts'
import { SuggestionTree } from '../../SuggestionTree'
import { FileMapping } from '../classes/FileMapping'
import { DoAllSuggestion } from '../classes/Suggestion/DoAllSuggestion'
import { FileMappingParser } from '../parsers/FileMappingParser'
import { SuggestionParser } from '../parsers/SuggestionParser'
import { DiscoPoPCodeLensProvider } from '../../CodeLensProvider'

export abstract class DiscoPoPRunner {
    private constructor() {
        throw new Error('This class cannot be instantiated.')
    }

    static async runConfiguration(configuration: Configuration) {
        // the configuration can be either a DefaultConfiguration or a Configuration
        // if it is a Configuration, we need to combine it with the default configuration to get a "full" configuration

        // use the withProgress API to indicate how much progress was made
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Running DiscoPoP',
                cancellable: false, // TODO true
            },
            async (progress, token) => {
                // STEP 1: collect info
                progress.report({
                    increment: 5,
                    message: 'Collecting configuration info...',
                }) // 5% progress
                const fullConfiguration = await this._getFullConfiguration(
                    configuration
                )

                // STEP 2: create build directory
                progress.report({
                    increment: 5,
                    message: 'Creating build directory...',
                }) // 10% progress
                if (!fs.existsSync(fullConfiguration.getBuildDirectory())) {
                    fs.mkdirSync(fullConfiguration.getBuildDirectory())
                } else {
                    if (
                        await UIPrompts.actionConfirmed(
                            'The build directory already exists. Do you want to overwrite it?'
                        )
                    ) {
                        fs.rmSync(fullConfiguration.getBuildDirectory(), {
                            recursive: true,
                        })
                        fs.mkdirSync(fullConfiguration.getBuildDirectory())
                    } else {
                        vscode.window.showInformationMessage('Aborting...')
                        return
                    }
                }

                // STEP 3: run cmake
                progress.report({ increment: 15, message: 'Running CMAKE...' }) // 25% progress
                const cmakeWrapperScript = `${Config.discopopRoot}/build/scripts/CMAKE_wrapper.sh`
                await new Promise<void>((resolve, reject) => {
                    exec(
                        `${cmakeWrapperScript} ${fullConfiguration.getProjectPath()}`,
                        { cwd: fullConfiguration.getBuildDirectory() },
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

                // STEP 4: run make
                progress.report({ increment: 15, message: 'Running MAKE...' }) // 40% progress
                await new Promise<void>((resolve, reject) => {
                    exec(
                        `DP_FM_PATH=${fullConfiguration.getProjectPath()}/FileMapping.txt make > make.log 2>&1`,
                        { cwd: fullConfiguration.getBuildDirectory() },
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

                // // NOTE: this is a possible approach on how to automatically detect the executable name: parse the make log and look for "Linking CXX executable"
                // let autoDetectedExecutableName: string | undefined
                // const makeLog = fs.readFileSync(`${fullConfiguration.getBuildDirectory()}/make.log`, 'utf-8')
                // const regex = /Linking CXX executable ([a-zA-Z0-9_]+)/
                // const match = makeLog.match(regex)
                // if (match) {
                //    vscode.window.showInformationMessage("Executable name detected: " + match[1])
                //    autoDetectedExecutableName = match[1]
                // }
                // else {
                //    vscode.window.showErrorMessage("Could not automatically detect executable name. Please specify it manually.")
                //    return
                // }

                // STEP 5: run the executable
                progress.report({
                    increment: 20,
                    message: 'Running executable...',
                }) // 60% progress
                await new Promise<void>((resolve, reject) => {
                    exec(
                        `${fullConfiguration.getBuildDirectory()}/${fullConfiguration.getExecutableName()} ${
                            fullConfiguration.getExecutableArguments()
                                ? fullConfiguration.getExecutableArguments()
                                : ''
                        }`,
                        { cwd: fullConfiguration.getBuildDirectory() },
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

                // STEP 6: run discopop_explorer
                progress.report({
                    increment: 30,
                    message: 'Running discopop_explorer...',
                }) // 90% progress
                // TODO errors are not reliably reported? --> fix in discopop_explorer!
                await new Promise<void>((resolve, reject) => {
                    exec(
                        `python3 -m discopop_explorer`, //--fmap ${fullConfiguration.getBuildDirectory()}/FileMapping.txt --path ${fullConfiguration.getBuildDirectory()} --dep-file ${fullConfiguration.getBuildDirectory()}/${fullConfiguration.getExecutableName()}_dep.txt --json patterns.json`,
                        {
                            cwd: `${fullConfiguration.getBuildDirectory()}/.discopop`,
                        },
                        (err, stdout, stderr) => {
                            if (err) {
                                console.log(`error: ${err.message}`)
                                console.log(`stdout: ${stdout}`)
                                console.log(`stderr: ${stderr}`)
                                vscode.window.showErrorMessage(
                                    `Discopop_explorer failed with error message ${err.message}`
                                )
                                reject()
                                return
                            }
                            resolve()
                        }
                    )
                })

                // ensure that patterns.json was created
                if (
                    !fs.existsSync(
                        `${fullConfiguration.getBuildDirectory()}/.discopop/explorer/patterns.json`
                    )
                ) {
                    vscode.window.showErrorMessage(
                        'Could not find patterns.json in the build directory. Aborting...'
                    )
                    return
                }

                // STEP 7: parse the results
                progress.report({ increment: 5, message: 'Parsing results...' }) // 95% progress
                // parse the FileMapping.txt file
                const fileMapping = FileMappingParser.parseFile(
                    `${fullConfiguration.getBuildDirectory()}/.discopop/FileMapping.txt`
                )

                // parse the patterns.json file
                const discoPoPResults = SuggestionParser.parseFile(
                    `${fullConfiguration.getBuildDirectory()}/.discopop/explorer/patterns.json`
                )

                // STEP 8: show the results
                progress.report({
                    increment: 4,
                    message: 'Preparing result view...',
                }) // 99% progress
                const suggestionTree = new SuggestionTree(
                    fileMapping,
                    discoPoPResults
                )
                const suggestionTreeDisposable =
                    vscode.window.registerTreeDataProvider(
                        'sidebar-suggestions-view',
                        suggestionTree
                    )

                // enable code lenses for all suggestions
                const codeLensProvider = new DiscoPoPCodeLensProvider(
                    fileMapping,
                    discoPoPResults.getAllSuggestions()
                )
                const codeLensProviderDisposable =
                    vscode.languages.registerCodeLensProvider(
                        { scheme: 'file', language: 'cpp' },
                        codeLensProvider
                    )

                // DONE
                progress.report({ increment: 1, message: 'Done!' }) // 100% progress

                // TODO rerunning should kill the old SuggestionTree and create a new one
                // TODO rerunning should kill the old CodeLensProvider and create a new one
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
}
