import * as vscode from 'vscode'
import { Config } from './Config'

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
}
