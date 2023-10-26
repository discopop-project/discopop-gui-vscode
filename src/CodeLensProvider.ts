import * as vscode from 'vscode'
import { Position } from 'vscode'
import { Config } from './Config'
import { Suggestion } from './DiscoPoP/classes/Suggestion/Suggestion'
import { FileMapping } from './DiscoPoP/classes/FileMapping'
import { Commands } from './Commands'

export class DiscoPoPCodeLens extends vscode.CodeLens {
    /**
     * The provider that is responsible for this CodeLens.
     *
     * MUST be set by the provider before returning the CodeLens.
     * This is required so we can apply the suggestion when the CodeLens is clicked (in order to move other codeLenses).
     */
    public responsibleProvider: DiscoPoPCodeLensProvider

    /** The suggestion represented by this CodeLens */
    public suggestion: Suggestion

    public constructor(suggestion: Suggestion) {
        super(
            new vscode.Range(
                suggestion.startLine - 1,
                0,
                suggestion.startLine - 1,
                0
            )
        )
        this.suggestion = suggestion
        this.command = {
            title: `discovered potential parallelism: ${suggestion.pragma}. Click to insert.`,
            command: Commands.codeLensAction,
            arguments: [this],
        }
    }
}

export class DiscoPoPCodeLensProvider
    implements vscode.CodeLensProvider<DiscoPoPCodeLens>
{
    public hidden: boolean = false
    private suggestions: Suggestion[] = []
    private fileMapping: FileMapping

    // emitter and its event
    public _onDidChangeCodeLenses: vscode.EventEmitter<void> =
        new vscode.EventEmitter<void>()
    public readonly onDidChangeCodeLenses: vscode.Event<void> =
        this._onDidChangeCodeLenses.event

    constructor(fileMapping: FileMapping, suggestions: Suggestion[]) {
        console.log('constructed codelensprovider')
        this.fileMapping = fileMapping
        this.suggestions = suggestions

        // update lenses when settings change (codeLenses visibility might have changed)
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire()
        })
    }

    public provideCodeLenses(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
    ): DiscoPoPCodeLens[] | Thenable<DiscoPoPCodeLens[]> {
        if (Config.codeLensEnabled && !this.hidden) {
            console.log(
                'looking for lenses: in ' + document.fileName.toString()
            )
            console.log('  filemapping: ' + this.fileMapping)
            console.log(
                '  fmap.getFileID(): ' +
                    this.fileMapping.getFileId(document.fileName.toString())
            )
            console.log('  suggestions: ' + this.suggestions)

            const lenses = this.suggestions
                // only suggestions for this file
                .filter((suggestion) => {
                    const fileId = this.fileMapping.getFileId(
                        document.fileName.toString()
                    )
                    return suggestion.fileId === fileId
                })
                // only suggestions that are not yet applied
                .filter((suggestion) => {
                    return !suggestion.applied
                })
                // get CodeLens for each suggestion
                .map((suggestion) => suggestion.getCodeLens())

            lenses.forEach((lens) => {
                lens.responsibleProvider = this
            })

            return lenses
        }
        return []
    }

    public resolveCodeLens(
        codeLens: DiscoPoPCodeLens,
        token: vscode.CancellationToken
    ) {
        if (Config.codeLensEnabled) {
            return codeLens
        }
        return null
    }

    public insertRecommendation(suggestion: Suggestion) {
        suggestion.applied = true
        this._insertSnippet(suggestion)
        this._moveOtherRecommendations(suggestion)
        // StateManager.save(this.context, recommendation.id, recommendation)
    }

    private _moveOtherRecommendations = (
        removedSuggestion: Suggestion,
        offset: number = 1
    ) => {
        this.suggestions.map((suggestion) => {
            if (suggestion.id === removedSuggestion.id) {
                return
            }
            if (suggestion.startLine > removedSuggestion.startLine) {
                if (suggestion.startLine) {
                    suggestion.startLine += offset
                }
                if (suggestion.endLine) {
                    suggestion.endLine += offset
                }
                // StateManager.save(
                //     this.context,
                //     recommendation.id,
                //     recommendation
                // )
            }
        })
        this._onDidChangeCodeLenses.fire()
    }

    private _insertSnippet(suggestion: Suggestion) {
        const editor = vscode.window.activeTextEditor

        // get indentation of line where the suggestion is inserted
        // by matching any whitespace at the beginning of the line
        const indentation = editor.document
            .lineAt(suggestion.startLine - 1)
            .text.match(/^\s*/)[0]

        editor.edit((editBuilder) => {
            editBuilder.insert(
                new Position(suggestion.startLine - 1, 0),
                indentation + suggestion.pragma + '\n'
            )
        })
    }
}
