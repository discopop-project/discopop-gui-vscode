import * as vscode from 'vscode'
import { DiscoPoPExtension } from './DiscoPoPExtension'

let extension: DiscoPoPExtension | undefined = undefined

export async function activate(context: vscode.ExtensionContext) {
    extension = new DiscoPoPExtension(context)
    await extension.activate()
}

// this method is called when your extension is deactivated
export function deactivate() {
    extension?.deactivate()
}
