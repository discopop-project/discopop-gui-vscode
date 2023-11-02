// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { Commands } from './Utils/Commands'
import { ProjectManager } from './ProjectManager/ProjectManager'
import { Configuration } from './ProjectManager/Configuration'
import { DiscoPoPDetailViewProvider } from './DiscoPoP/DiscoPoPDetailViewProvider'
import { Suggestion } from './DiscoPoP/classes/Suggestion/Suggestion'
import { FileMapping } from './FileMapping/FileMapping'
import { DiscoPoPCodeLens } from './DiscoPoP/DiscoPoPCodeLensProvider'
import { HotspotDetailViewProvider } from './HotspotDetection/HotspotDetailViewProvider'
import { Hotspot } from './HotspotDetection/classes/Hotspot'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {
    // PROJECTS
    ProjectManager.load(context)

    // SUGGESTIONS
    // in package.json a welcome message is configured that is shown until a configuration was run

    // HOTSPOTS
    // in package.json a welcome message is configured that is shown until a configuration was run

    // SUGGESTION DETAIL
    // an undefined suggestion results in a placeholder text being shown until a suggestion is selected
    DiscoPoPDetailViewProvider.load(undefined)

    // HOTSPOT DETAIL
    // an undefined hotspot results in a placeholder text being shown until a hotspot is selected
    HotspotDetailViewProvider.load(undefined)

    // COMMANDS
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
                DiscoPoPDetailViewProvider.load(suggestion)
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
            Commands.showHotspotDetails,
            async (hotspot: Hotspot, fileMapping: FileMapping) => {
                HotspotDetailViewProvider.load(hotspot)
                const filePath = fileMapping.getFilePath(hotspot.fid)
                const document = await vscode.workspace.openTextDocument(
                    filePath
                )
                const editor = await vscode.window.showTextDocument(
                    document,
                    vscode.ViewColumn.Active,
                    false
                )
                const line = new vscode.Position(hotspot.lineNum - 1, 0)
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
