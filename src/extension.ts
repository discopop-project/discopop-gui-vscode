// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { Commands } from './Commands'
import { ProjectManager } from './ProjectManager/ProjectManager'
import { Configuration } from './ProjectManager/Configuration'
import { DetailViewProvider } from './DetailViewProvider'
import { Suggestion } from './DiscoPoP/classes/Suggestion/Suggestion'
import { FileMapping } from './DiscoPoP/classes/FileMapping'
import { DiscoPoPCodeLens } from './CodeLensProvider'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {
    // TODO disable unused views until they are needed
    // // EXAMPLE ON HOW TO SHOW OR HIDE VIEWS:
    // // 1) set context variable to true or false (or a value)
    // vscode.commands.executeCommand("setContext", "discopop:enable_detail_view", false)

    // setTimeout(() => { // after a 5 second timeout the detail view is enabled
    //     vscode.commands.executeCommand("setContext", "discopop:enable_detail_view", true)
    // }, 5000)

    // // 2) edit the package.json view to contain a when clause that checks the context variable:
    // // {
    // //     "type": "webview",
    // //     "id": "detail-view",
    // //     "name": "RECOMMENDATION DETAIL",
    // //     "when": "discopop:enable_detail_view"
    // // }

    // Projects Sidebar
    const projectManager = ProjectManager.getInstance(context)

    // TODO move all the command registering out of here and into the respective classes (ProjectManager, CodeLensProvider, etc.)

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.runConfiguration,
            async (configuration: Configuration) => {
                configuration.run()
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.showSuggestionDetails,
            async (suggestion: Suggestion, fileMapping: FileMapping) => {
                DetailViewProvider.getInstance(context, suggestion)
                const filePath = fileMapping.getFilePath(suggestion.fileId)
                const document = await vscode.workspace.openTextDocument(
                    filePath
                )
                const editor = await vscode.window.showTextDocument(
                    document,
                    vscode.ViewColumn.Active,
                    false
                )
                const line = new vscode.Position(suggestion.startLine - 1, 0)
                editor.selections = [new vscode.Selection(line, line)]
                const range = new vscode.Range(line, line)
                editor.revealRange(range)
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.codeLensAction,
            async (codeLens: DiscoPoPCodeLens) => {
                codeLens.responsibleProvider.insertRecommendation(
                    codeLens.suggestion
                )
                // TODO it would be nice to also show the suggestion as applied in the tree view
                // --> themeIcon: record/pass
                // TODO before inserting, preview the changes and request confirmation
                // --> we could peek the patch file as a preview https://github.com/microsoft/vscode/blob/8434c86e5665341c753b00c10425a01db4fb8580/src/vs/editor/contrib/gotoSymbol/goToCommands.ts#L760
                // --> we should also set the detail view to the suggestion that is being applied
                // --> if hotspot results are available for the loop/function, we should also show them in the detail view
            }
        )
    )
}

// this method is called when your extension is deactivated
export function deactivate() {}
