import * as vscode from 'vscode'
import { Config } from '../Config'
import * as fs from 'fs'
import { exec } from 'child_process'
import Utils from '../Utils'

export class NewRunner {
    private projectRoot: string
    private buildDirectoryPath: string
    private executableName: string
    private executableArgs: string

    constructor(
        projectRoot: string,
        executableName: string,
        executableArgs: string,
        buildDirectoryPath: string = Utils.getWorkspacePath() + '/.discopop'
    ) {
        this.projectRoot = projectRoot
        this.executableName = executableName
        this.executableArgs = executableArgs
        this.buildDirectoryPath = buildDirectoryPath
    }

    async execute() {
        vscode.window.showInformationMessage(
            'Running DiscoPoP on project ' +
                this.projectRoot +
                ' with executable ' +
                this.executableName +
                ' and arguments ' +
                this.executableArgs +
                '. Results will be stored in ' +
                this.buildDirectoryPath
        )

        // run filemapping in the selected directory
        const fileMappingScript = `${Config.discopopRoot}/build/scripts/dp-fmap`
        await new Promise<void>((resolve, reject) => {
            exec(
                fileMappingScript,
                { cwd: this.projectRoot },
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
        if (!fs.existsSync(this.buildDirectoryPath)) {
            fs.mkdirSync(this.buildDirectoryPath)
        } else {
            const answer = await vscode.window.showWarningMessage(
                "There is already a directory called '.discopop' in your workspace. Do you want to overwrite it?",
                { modal: true },
                'Yes',
                'No'
            )
            if (answer === 'Yes') {
                fs.rmSync(this.buildDirectoryPath, { recursive: true })
                fs.mkdirSync(this.buildDirectoryPath)
            } else {
                vscode.window.showInformationMessage('Aborting...')
                return
            }
        }

        // run the cmake wrapper script in the build directory, providing the projectDirectoryPath as an argument
        const cmakeWrapperScript = `${Config.discopopRoot}/build/scripts/CMAKE_wrapper.sh`
        await new Promise<void>((resolve, reject) => {
            exec(
                `${cmakeWrapperScript} ${this.projectRoot}`,
                { cwd: this.buildDirectoryPath },
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
                `DP_FM_PATH=${this.projectRoot}/FileMapping.txt make > make.log 2>&1`,
                { cwd: this.buildDirectoryPath },
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

        // automatically detect the executable name
        //let autoDetectedExecutableName: string | undefined
        //const makeLog = fs.readFileSync(`${this.buildDirectoryPath}/make.log`, 'utf-8')
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
                `${this.buildDirectoryPath}/${this.executableName} ${
                    this.executableArgs ? this.executableArgs : ''
                }`,
                { cwd: this.buildDirectoryPath },
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
            `${this.projectRoot}/FileMapping.txt`,
            `${this.buildDirectoryPath}/FileMapping.txt`
        )
        fs.rmSync(`${this.projectRoot}/FileMapping.txt`)

        // run discopop_explorer in the build directory
        // TODO errors are not reliably reported --> fix in discopop_explorer!
        await new Promise<void>((resolve, reject) => {
            exec(
                `python3 -m discopop_explorer --fmap ${this.buildDirectoryPath}/FileMapping.txt --path ${this.buildDirectoryPath} --dep-file ${this.buildDirectoryPath}/${this.executableName}_dep.txt --json patterns.json`,
                { cwd: this.buildDirectoryPath },
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
                this.buildDirectoryPath
        )

        // interpret results and somehow show them to the user
        // TODO
    }
}
