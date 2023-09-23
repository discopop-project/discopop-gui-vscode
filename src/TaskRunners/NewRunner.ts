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

    constructor(context: vscode.ExtensionContext, projectRoot: string, executableName: string, executableArgs: string) {
        this.projectRoot = projectRoot
        this.buildDirectoryPath = Utils.getCWD(context)
        this.executableName = executableName
        this.executableArgs = executableArgs
    }

    async execute() {
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
        }
        else {
            const answer = await vscode.window.showInformationMessage("There is already a directory called '.discopop'. Do you want to overwrite it?", "Yes", "No")
            if (answer === "Yes") {
                fs.rmdirSync(this.buildDirectoryPath, { recursive: true })
                fs.mkdirSync(this.buildDirectoryPath)
            }
            else {
                vscode.window.showInformationMessage("Aborting...")
                return
            }
        }


        // run the cmake wrapper script in the build directory, providing the projectDirectoryPath as an argument
        const cmakeWrapperScript = `${Config.discopopRoot}/build/scripts/CMAKE_wrapper.sh`
        await new Promise<void>((resolve, reject) => {
            exec(
                `${cmakeWrapperScript} ${this.projectRoot}`,
                { cwd: this.buildDirectoryPath},
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
                `DP_FM_PATH=${this.projectRoot}/FileMapping.txt make`,
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


        // run the executable with the arguments
        await new Promise<void>((resolve, reject) => {
            exec(
                `${this.buildDirectoryPath}/${this.executableName} ${this.executableArgs ? this.executableArgs : ""}`,
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

        // run discopop_explorer in the build directory
        await new Promise<void>((resolve, reject) => {
            exec(
                `python3 -m discopop_explorer --fmap ${this.projectRoot}/FileMapping.txt --path ${this.buildDirectoryPath} --dep-file ${this.buildDirectoryPath}/${this.executableName}_dep.txt --json patterns.json`,
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

        // interpret results and somehow show them to the user
        // TODO
    }
}