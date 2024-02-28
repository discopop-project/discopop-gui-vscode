import * as vscode from 'vscode'
import { DiscoPoPExtension } from './DiscoPoPExtension'

export function activate(context: vscode.ExtensionContext) {
    const extension = new DiscoPoPExtension(context)
}

export function deactivate() {}
