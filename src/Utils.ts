import path = require('path')
import * as vscode from 'vscode'
import { Config } from './Config'
import { ItemType } from './ItemType'
import { StateManager } from './misc/StateManager'
import { TreeItem } from './Provider/TreeDataProvider'
import { ResultType } from './ResultType'

export default class Utils {
    static getCWD = (context: vscode.ExtensionContext) => {
        if (Config.cwdWorkspace) {
            return this.getWorkspacePath() + '/.discopop'
        }
        return context.storageUri?.path
    }

    static getWorkspacePath = () => {
        return vscode.workspace.workspaceFolders[0].uri.path
    }

    static getNonce() {
        let text = ''
        const possible =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length))
        }
        return text
    }

    static async handleClArgs(context): Promise<string> {
        const stateManager = new StateManager(context)

        const existingClArgs = stateManager.read('clArgs')
        const value = existingClArgs ? existingClArgs : ''

        const clArgs = await vscode.window.showInputBox({
            value: value,
            prompt: 'Please enter the command line arguments (optional): ',
        })

        if (!clArgs?.length) {
            vscode.window.showInformationMessage(
                'Executing without command line arguments!'
            )
        }

        if (clArgs?.length) {
            stateManager.save('clArgs', clArgs)
        }

        return clArgs
    }

    static async handleScriptPath(context): Promise<string> {
        const stateManager = new StateManager(context)

        const existingPath = stateManager.read('scriptPath')
        const value = existingPath ? existingPath : ''

        const scriptPath = await vscode.window.showInputBox({
            value: value,
            prompt: 'Please enter the path to the script (This extension expects a FileMapping.txt and ranked_patterns.txt inside a .discopop folder to work): ',
        })

        /*         if (!scriptPath?.length) {
            vscode.window.showErrorMessage(
                'You need to specify a path to the script'
            )
            return
        } */

        stateManager.save('scriptPath', scriptPath)

        return scriptPath
    }

    public static getIcon(item: TreeItem, context): any {
        const nodeType = item.contextValue
        if (nodeType === ItemType.File && item.active) {
            return {
                light: vscode.Uri.joinPath(
                    context.extensionUri,
                    'media',
                    'file_active_light.svg'
                ),
                dark: vscode.Uri.joinPath(
                    context.extensionUri,
                    'media',
                    'file_active_dark.svg'
                ),
            }
        }
        if (nodeType === ItemType.File && !item.active) {
            return new vscode.ThemeIcon('eye-closed')
        }
        if (nodeType === ItemType.Result) {
            return new vscode.ThemeIcon('output')
        }
        if (nodeType === ItemType.Folder) {
            if (item.active) {
                return new vscode.ThemeIcon('folder-active')
            }
            return new vscode.ThemeIcon('folder')
        }
        return null
    }

    public static getResultLabel(resultType: ResultType, line) {
        if (resultType === ResultType.DoAll) {
            return `DOALL AT L. ${line}`
        }
        if (resultType === ResultType.Reduction) {
            return `REDUCTION AT L. ${line}`
        }
    }
}
