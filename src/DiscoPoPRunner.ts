import * as vscode from 'vscode'
import { Config } from './Config'
import * as fs from 'fs'
import { exec } from 'child_process'
import {
    Configuration,
    DefaultConfiguration,
} from './ProjectManager/Configuration'
import { UIPrompts } from './UIPrompts'

// TODO use withProgress to show progress of the execution

export class DiscoPoPRunner {
    static async runConfiguration(configuration: Configuration) {
        let fullConfiguration: DefaultConfiguration
        if (configuration instanceof DefaultConfiguration) {
            fullConfiguration = configuration
        } else {
            fullConfiguration =
                await this._combineConfigurationWithDefaultConfigurationToGetExecutableConfiguration(
                    configuration
                )
        }

        vscode.window.showInformationMessage(
            'Running DiscoPoP on project ' +
                fullConfiguration.projectPath +
                ' with executable ' +
                fullConfiguration.executableName +
                ' and arguments ' +
                fullConfiguration.executableArguments +
                '. Results will be stored in ' +
                fullConfiguration.buildDirectory
        )

        // run filemapping in the selected directory
        const fileMappingScript = `${Config.discopopRoot}/build/scripts/dp-fmap`
        await new Promise<void>((resolve, reject) => {
            exec(
                fileMappingScript,
                { cwd: fullConfiguration.projectPath },
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
        if (!fs.existsSync(fullConfiguration.buildDirectory)) {
            fs.mkdirSync(fullConfiguration.buildDirectory)
        } else {
            if (
                UIPrompts.actionConfirmed(
                    'The build directory already exists. Do you want to overwrite it?'
                )
            ) {
                fs.rmSync(fullConfiguration.buildDirectory, { recursive: true })
                fs.mkdirSync(fullConfiguration.buildDirectory)
            } else {
                vscode.window.showInformationMessage('Aborting...')
                return
            }
        }

        // run the cmake wrapper script in the build directory, providing the projectDirectoryPath as an argument
        const cmakeWrapperScript = `${Config.discopopRoot}/build/scripts/CMAKE_wrapper.sh`
        await new Promise<void>((resolve, reject) => {
            exec(
                `${cmakeWrapperScript} ${fullConfiguration.projectPath}`,
                { cwd: fullConfiguration.buildDirectory },
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
                `DP_FM_PATH=${fullConfiguration.projectPath}/FileMapping.txt make > make.log 2>&1`,
                { cwd: fullConfiguration.buildDirectory },
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
        //const makeLog = fs.readFileSync(`${fullConfiguration.buildDirectory}/make.log`, 'utf-8')
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
                `${fullConfiguration.buildDirectory}/${
                    fullConfiguration.executableName
                } ${
                    fullConfiguration.executableArguments
                        ? fullConfiguration.executableArguments
                        : ''
                }`,
                { cwd: fullConfiguration.buildDirectory },
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
            `${fullConfiguration.projectPath}/FileMapping.txt`,
            `${fullConfiguration.buildDirectory}/FileMapping.txt`
        )
        fs.rmSync(`${fullConfiguration.projectPath}/FileMapping.txt`)

        // run discopop_explorer in the build directory
        // TODO errors are not reliably reported --> fix in discopop_explorer!
        await new Promise<void>((resolve, reject) => {
            exec(
                `python3 -m discopop_explorer --fmap ${fullConfiguration.buildDirectory}/FileMapping.txt --path ${fullConfiguration.buildDirectory} --dep-file ${fullConfiguration.buildDirectory}/${fullConfiguration.executableName}_dep.txt --json patterns.json`,
                { cwd: fullConfiguration.buildDirectory },
                (err, stdout, stderr) => {
                    if (err) {
                        console.log(`error: ${err.message}`)
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

        vscode.window.showInformationMessage(
            'DiscoPoP finished running. Results are stored in ' +
                fullConfiguration.buildDirectory
        )

        // interpret results and somehow show them to the user
        // TODO
    }

    private static async _combineConfigurationWithDefaultConfigurationToGetExecutableConfiguration(
        configuration: Configuration
    ): Promise<DefaultConfiguration> {
        const defaults = configuration.getParent().getDefaultConfiguration()
        const combined = new DefaultConfiguration(
            configuration.projectPath ?? defaults.projectPath,
            configuration.executableName ?? defaults.executableName,
            configuration.executableArguments ?? defaults.executableArguments,
            configuration.buildDirectory ?? defaults.buildDirectory,
            configuration.getName() ?? defaults.getName()
        )

        combined.setName(configuration.getName() ?? defaults.getName())

        return combined
    }
}
