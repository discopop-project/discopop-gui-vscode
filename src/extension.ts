// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { DiscoPoPExtension } from './DiscoPoPExtension'
import { runDiscoPoP } from './ToolRunners/Test'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let extension: DiscoPoPExtension | undefined = undefined

export function activate(context: vscode.ExtensionContext) {
    runDiscoPoP().then(() => {
        extension = new DiscoPoPExtension(context)
        extension.activate()
    })
}

// this method is called when your extension is deactivated
export function deactivate() {
    extension?.deactivate()
}
