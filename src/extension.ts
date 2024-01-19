import * as vscode from 'vscode'
import { DiscoPoPExtension } from './DiscoPoPExtension'

let extension: DiscoPoPExtension | undefined = undefined

export function activate(context: vscode.ExtensionContext) {
    extension = new DiscoPoPExtension(context)
    extension.activate()
}

// this method is called when your extension is deactivated
export function deactivate() {
    extension?.deactivate()
}
