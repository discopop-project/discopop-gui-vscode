import * as path from 'path'
import * as fs from 'fs'
import * as vscode from 'vscode'
import { CombinedSuggestion } from '../resultStore/CombinedSuggestion'

export namespace SuggestionPreview {
    export type Mode = 'Editor' | 'Peek'
    export function previewSuggestion(
        suggestion: CombinedSuggestion,
        mode: Mode
    ) {
        const patchFileUris = fs
            .readdirSync(
                path.join(
                    suggestion.dotDiscopop,
                    'patch_generator',
                    `${suggestion.patternID}`
                )
            )
            .map((patchFile) => {
                return vscode.Uri.file(
                    path.join(
                        suggestion.dotDiscopop,
                        'patch_generator',
                        `${suggestion.patternID}`,
                        patchFile
                    )
                )
            })

        if (mode === 'Editor') {
            showSuggestionInEditor(patchFileUris)
        } else if (mode === 'Peek') {
            showSuggestionInPeek(patchFileUris, suggestion)
        } else {
            console.error(
                'tried to preview suggestion with unknown mode: ',
                mode
            )
        }
    }

    function showSuggestionInEditor(patchFileUris: vscode.Uri[]) {
        const viewColumn =
            vscode.window.activeTextEditor?.viewColumn + 1 ||
            vscode.ViewColumn.Beside
        patchFileUris.forEach((uri) => {
            vscode.workspace.openTextDocument(uri).then(
                (document) => {
                    vscode.window.showTextDocument(document, viewColumn)
                },
                (error) => {
                    console.error('failed to open patch file', error)
                }
            )
        })
    }

    function showSuggestionInPeek(
        patchFileUris: vscode.Uri[],
        suggestion: CombinedSuggestion
    ) {
        // show patchFiles starting at line 0
        const patchFileLocations = patchFileUris.map((uri) => {
            return new vscode.Location(uri, new vscode.Position(0, 0))
        })

        // the peek will be shown at the endLine of the suggestion
        const startUri = vscode.Uri.file(suggestion.filePath)
        const startPosition = new vscode.Position(
            suggestion.mappedEndLine - 1,
            0
        )

        // show the peek
        const multiple = 'peek'
        vscode.commands.executeCommand(
            'editor.action.peekLocations',
            startUri,
            startPosition,
            patchFileLocations,
            multiple
        )
    }
}
