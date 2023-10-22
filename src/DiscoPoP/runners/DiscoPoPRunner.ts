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
import CodeLensProvider from '../../CodeLensProvider'
import { FileMapping } from '../classes/FileMapping'
import { DoAllSuggestion } from '../classes/Suggestion/DoAllSuggestion'
import { FileMappingParser } from '../parsers/FileMappingParser'
import { SuggestionParser } from '../parsers/SuggestionParser'

// TODO use withProgress to show progress of the execution

export class DiscoPoPRunner {
    static async runConfiguration(configuration: Configuration) {
        // the configuration can be either a DefaultConfiguration or a Configuration
        // if it is a Configuration, we need to combine it with the default configuration to get a "full" configuration
        const fullConfiguration: DefaultConfiguration =
            await this._getFullConfiguration(configuration)

        // show info
        vscode.window.showInformationMessage(
            'Running DiscoPoP on project ' +
                fullConfiguration.getProjectPath() +
                ' with executable ' +
                fullConfiguration.getExecutableName() +
                ' and arguments ' +
                fullConfiguration.getExecutableArguments() +
                '. Results will be stored in ' +
                fullConfiguration.getBuildDirectory()
        )

        // run filemapping in the selected directory
        const fileMappingScript = `${Config.discopopRoot}/build/scripts/dp-fmap`
        await new Promise<void>((resolve, reject) => {
            exec(
                fileMappingScript,
                { cwd: fullConfiguration.getProjectPath() },
                (err, stdout, stderr) => {
                    if (err) {
                        console.log(`error: ${err.message}`)
                        vscode.window.showErrorMessage(
                            `Filemapping failed with error message ${err.message}`
                        )
                        reject()
                        return
                    }
                    resolve()
                }
            )
        })

        // create a build directory
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

        // run the cmake wrapper script in the build directory, providing the projectDirectoryPath as an argument
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

        // run make in the build directory (providing projectDirectoryPath/FileMapping.txt as an environment variable DP_FM_PATH)
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

        // approach on how to automatically detect the executable name: parse the make log and look for "Linking CXX executable"
        //let autoDetectedExecutableName: string | undefined
        //const makeLog = fs.readFileSync(`${fullConfiguration.getBuildDirectory()}/make.log`, 'utf-8')
        //const regex = /Linking CXX executable ([a-zA-Z0-9_]+)/
        //const match = makeLog.match(regex)
        //if (match) {
        //    vscode.window.showInformationMessage("Executable name detected: " + match[1])
        //    autoDetectedExecutableName = match[1]
        //}
        //else {
        //    vscode.window.showErrorMessage("Could not automatically detect executable name. Please specify it manually.")
        //    return
        //}

        // run the executable with the arguments
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

        // move the FileMapping.txt file to the build directory
        fs.copyFileSync(
            `${fullConfiguration.getProjectPath()}/FileMapping.txt`,
            `${fullConfiguration.getBuildDirectory()}/FileMapping.txt`
        )
        fs.rmSync(`${fullConfiguration.getProjectPath()}/FileMapping.txt`)

        // run discopop_explorer in the build directory
        // TODO errors are not reliably reported --> fix in discopop_explorer!
        await new Promise<void>((resolve, reject) => {
            exec(
                `python3 -m discopop_explorer --fmap ${fullConfiguration.getBuildDirectory()}/FileMapping.txt --path ${fullConfiguration.getBuildDirectory()} --dep-file ${fullConfiguration.getBuildDirectory()}/${fullConfiguration.getExecutableName()}_dep.txt --json patterns.json`,
                { cwd: fullConfiguration.getBuildDirectory() },
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

        // show info
        vscode.window.showInformationMessage(
            'DiscoPoP finished running. Results are stored in ' +
                fullConfiguration.getBuildDirectory()
        )

        // ensure that patterns.json exists (located in the build directory)
        if (
            !fs.existsSync(
                `${fullConfiguration.getBuildDirectory()}/patterns.json`
            )
        ) {
            vscode.window.showErrorMessage(
                'Could not find patterns.json in the build directory. Aborting...'
            )
            return
        }

        // parse the FileMapping.txt file
        const fileMapping = FileMappingParser.parseFile(
            `${fullConfiguration.getBuildDirectory()}/FileMapping.txt`
        )

        // parse the patterns.json file
        const discoPoPResults = SuggestionParser.parseFile(
            `${fullConfiguration.getBuildDirectory()}/patterns.json`
        )

        // show the results in a tree view (all patterns, grouped by their type: reduction, doall, ...)
        const suggestionTree = new SuggestionTree(fileMapping, discoPoPResults)
        vscode.window.registerTreeDataProvider(
            'sidebar-suggestions-view',
            suggestionTree
        )
        // TODO rerunning should kill the old SuggestionTree and create a new one

        // enable code lenses for all suggestions
        const codeLensProvider = new CodeLensProvider(
            fileMapping,
            discoPoPResults.getAllSuggestions()
        )
        const codeLensProviderDisposable =
            vscode.languages.registerCodeLensProvider(
                { scheme: 'file', language: 'cpp' },
                codeLensProvider
            )
        // TODO rerunning should kill the old CodeLensProvider and create a new one
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