import * as vscode from 'vscode'
import { CombinedHotspot } from '../resultStore/CombinedHotspot'
import { CombinedSuggestion } from '../resultStore/CombinedSuggestion'
import { CombinedDataDependency } from '../resultStore/CombinedDataDependency'

export class EditorSpotlight {
    private static decorations: vscode.TextEditorDecorationType[] = []

    private static async _revealLine(
        editor: vscode.TextEditor,
        linePosition: vscode.Position
    ) {
        editor.selections = [new vscode.Selection(linePosition, linePosition)]
        const startLineRange = new vscode.Range(linePosition, linePosition)
        editor.revealRange(startLineRange)
    }

    private static async getEditor(filePath: string) {
        const document = await vscode.workspace.openTextDocument(filePath)
        return await vscode.window.showTextDocument(
            document,
            vscode.ViewColumn.Active,
            false
        )
    }

    public static async hightlightSuggestion(suggestion: CombinedSuggestion) {
        const editor = await this.getEditor(suggestion.filePath)
        const startLine = new vscode.Position(suggestion.mappedStartLine - 1, 0)
        EditorSpotlight._revealLine(editor, startLine)

        // highlight the respective code lines
        // TODO this does not work well with composite suggestions (e.g. simple_gpu)
        // TODO we should remove the hightlight at some point (currently it disappears only when selecting another suggestion or reopening the file)
        EditorSpotlight._removeDecorations(
            editor,
            Decoration.YES,
            Decoration.MAYBE,
            Decoration.NO,
            Decoration.SOFT
        )
        const entireRange = new vscode.Range(
            startLine,
            new vscode.Position(suggestion.mappedEndLine - 1, 0)
        )
        editor.setDecorations(Decoration.SOFT, [{ range: entireRange }])
    }

    // TODO duplicate code
    public static async highlightHotspot(hotspot: CombinedHotspot) {
        const editor = await this.getEditor(hotspot.filePath)
        const startLine = new vscode.Position(hotspot.mappedStartLine - 1, 0)
        EditorSpotlight._revealLine(editor, startLine)

        // TODO: it would be nice to decorate all hotspots in the file at once and have some option to toggle them
        // TODO: it would be nice to decorate until the end of the function/loop (but we do not know the line number of the end)

        // remove all previous decorations
        EditorSpotlight._removeDecorations(
            editor,
            Decoration.YES,
            Decoration.MAYBE,
            Decoration.NO,
            Decoration.SOFT
        )

        // highlight the hotspot
        let decoration = Decoration.SOFT
        switch (hotspot.type) {
            case 'YES':
                decoration = Decoration.YES
                break
            case 'MAYBE':
                decoration = Decoration.MAYBE
                break
            case 'NO':
                decoration = Decoration.NO
                break
            default:
                console.error(
                    'tried to highlight hotspot with unknown hotness: ' +
                        hotspot.type
                )
        }
        // since we do not know the end of the hotspot, we just highlight the line
        const range = new vscode.Range(startLine, startLine)
        editor.setDecorations(decoration, [{ range: range }])
    }

    public static async hightlightDataDependency(
        combinedDataDependeny: CombinedDataDependency
    ) {
        const editor = await this.getEditor(combinedDataDependeny.filePath)
        const startLine = new vscode.Position(
            combinedDataDependeny.mappedLine - 1,
            0
        )
        EditorSpotlight._revealLine(editor, startLine)

        // highlight the respective code lines
        EditorSpotlight._removeDecorations(
            editor,
            Decoration.YES,
            Decoration.MAYBE,
            Decoration.NO,
            Decoration.SOFT
        )
        const entireRange = new vscode.Range(
            startLine,
            new vscode.Position(combinedDataDependeny.mappedLine, 0)
        )
        editor.setDecorations(Decoration.SOFT, [{ range: entireRange }])
    }

    private static _removeDecorations(
        editor: vscode.TextEditor,
        ...decorations: vscode.TextEditorDecorationType[]
    ) {
        decorations.forEach((decoration) => {
            editor.setDecorations(decoration, [])
        })
    }
}

// TODO these decorations do not work well with light themes

/** Decorations to highlight code in the editor */
namespace Decoration {
    /** To indicate a hotspot with hotness YES */
    export const YES = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255,0,0,0.5)', // strong red
        isWholeLine: true,
    })

    /** To indicate a hotspot with hotness MAYBE */
    export const MAYBE = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255,25,0,0.2)', // slightly transparent red
        isWholeLine: true,
    })

    /** To indicate a hotspot with hotness NO */
    export const NO = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255,50,0,0.05)', // very transparent red
        isWholeLine: true,
    })

    /** Just a soft highlighting, e.g. to area affected by a suggestion */
    export const SOFT = vscode.window.createTextEditorDecorationType({
        // TODO improve this for light theme
        backgroundColor: 'rgba(255,255,255,0.05)',
        isWholeLine: true,
    })
}
