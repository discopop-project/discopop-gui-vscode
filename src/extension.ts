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
            Commands.runDiscoPoPAndHotspotDetection,
            async (configuration: Configuration) => {
                configuration.runDiscoPoPAndHotspotDetection()
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.runDiscoPoP,
            async (configuration: Configuration) => {
                configuration.runDiscoPoP()
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.runHotspotDetection,
            async (configuration: Configuration) => {
                configuration.runHotspotDetection()
            }
        )
    )

    // decorations for highlighting suggestions/hotspots
    const yesDecoration = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255,0,0,0.5)', // strong red
        isWholeLine: true,
    })
    const maybeDecoration = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255,25,0,0.2)', // slightly transparent red
        isWholeLine: true,
    })
    const noDecoration = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255,50,0,0.05)', // very transparent red
        isWholeLine: true,
    })

    const softHighlightDecoration =
        vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255,255,255,0.05)', // very transparent white // TODO this will not show up well in light mode
            isWholeLine: true,
        })

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
                const startLineRange = new vscode.Range(line, line)
                editor.revealRange(startLineRange)

                // highlight the respective code lines
                // TODO this does not work well with composite suggestions (e.g. simple_gpu)
                // TODO we should remove the hightlight at some point (currently it disappears only when selecting another suggestion or reopening the file)
                _removeDecorations(
                    editor,
                    yesDecoration,
                    maybeDecoration,
                    noDecoration,
                    softHighlightDecoration
                )
                const entireRange = new vscode.Range(
                    new vscode.Position(suggestion.startLine - 1, 0),
                    new vscode.Position(suggestion.endLine - 1, 0)
                )
                editor.setDecorations(softHighlightDecoration, [
                    { range: entireRange },
                ])
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

                // TODO: it would be nice to decorate all hotspots in the file at once and have some option to toggle them
                // TODO: it would be nice to decorate until the end of the function/loop (but we do not know the line number of the end)

                // remove all previous decorations
                _removeDecorations(
                    editor,
                    yesDecoration,
                    maybeDecoration,
                    noDecoration,
                    softHighlightDecoration
                )

                // highlight the hotspot
                let decoration = softHighlightDecoration
                switch (hotspot.hotness) {
                    case 'YES':
                        decoration = yesDecoration
                        break
                    case 'MAYBE':
                        decoration = maybeDecoration
                        break
                    case 'NO':
                        decoration = noDecoration
                        break
                    default:
                        console.error(
                            'tried to highlight hotspot with unknown hotness: ' +
                                hotspot.hotness
                        )
                }
                editor.setDecorations(decoration, [{ range }])
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

function _removeDecorations(
    editor: vscode.TextEditor,
    ...decorations: vscode.TextEditorDecorationType[]
) {
    decorations.forEach((decoration) => {
        editor.setDecorations(decoration, [])
    })
}

// this method is called when your extension is deactivated
export function deactivate() {}
