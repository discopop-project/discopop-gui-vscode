import * as vscode from 'vscode'
import { CombinedSuggestion } from '../resultStore/CombinedSuggestion'

export interface DiscoPoPCodeLensProviderCallbacks {
    // TODO overthink what codeLenses should do,
    //
}

export class DiscoPoPCodeLensProvider implements vscode.CodeLensProvider {
    private static _instance: DiscoPoPCodeLensProvider
    public static create(
        _context: vscode.ExtensionContext,
        _callbacks: DiscoPoPCodeLensProviderCallbacks
    ) {
        DiscoPoPCodeLensProvider._instance = new DiscoPoPCodeLensProvider()
        _context.subscriptions.push(
            vscode.languages.registerCodeLensProvider(
                { scheme: 'file', language: 'cpp' },
                this._instance
            )
        )

        vscode.commands.executeCommand(
            'setContext',
            'discopop.codeLensEnabled',
            'undefined' // yes, this is a string, it is supposed to be a string :)
        )

        vscode.commands.executeCommand(
            'setContext',
            'discopop.suggestionsAvailable',
            false
        )

        // TODO register commands for the lenses, then use the callbacks

        return DiscoPoPCodeLensProvider._instance
    }

    public show() {
        // TODO
    }

    public hide() {
        // TODO
    }

    // event system to tell vscode that the code lenses have changed
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
        new vscode.EventEmitter<void>()
    public onDidChangeCodeLenses?: vscode.Event<void> =
        this._onDidChangeCodeLenses.event
    private _refresh() {
        this._onDidChangeCodeLenses.fire
    }

    // called by vscode to provide code lenses
    public provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CodeLens[]> {
        // only suggestions for the current document
        const suggestions = this._combinedSuggestionsByFileAndLine.get(
            document.fileName
        )
        if (suggestions === undefined) {
            return []
        }

        // create a code lens for each line
        const codeLenses: vscode.CodeLens[] = []
        for (const [line, combinedSuggestions] of suggestions) {
            const range = new vscode.Range(line - 1, 0, line - 1, 0)
            const codeLens = new vscode.CodeLens(range)
            codeLens.command = {
                title: `Potential Parallelism (${combinedSuggestions.length})`,
                command: 'discopop.TODO',
                arguments: [document, line, combinedSuggestions],
            }
            codeLenses.push(codeLens)
        }

        return codeLenses
    }

    // not needed? can be used to improve performance
    // public resolveCodeLens?(codeLens: vscode.CodeLens, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens> {
    //     throw new Error('Method not implemented.')
    // }

    private _combinedSuggestionsByFileAndLine: Map<
        string,
        Map<number, CombinedSuggestion[]>
    > = undefined
    public set combinedSuggestions(
        combinedSuggestions: Map<string, CombinedSuggestion[]>
    ) {
        this._combinedSuggestionsByFileAndLine = new Map<
            string,
            Map<number, CombinedSuggestion[]>
        >()
        for (const [_, suggestions] of combinedSuggestions) {
            for (const suggestion of suggestions) {
                if (
                    !this._combinedSuggestionsByFileAndLine.has(
                        suggestion.filePath
                    )
                ) {
                    this._combinedSuggestionsByFileAndLine.set(
                        suggestion.filePath,
                        new Map<number, CombinedSuggestion[]>()
                    )
                }
                if (
                    !this._combinedSuggestionsByFileAndLine
                        .get(suggestion.filePath)
                        .has(suggestion.mappedStartLine)
                ) {
                    this._combinedSuggestionsByFileAndLine
                        .get(suggestion.filePath)
                        .set(suggestion.mappedStartLine, [])
                }
                this._combinedSuggestionsByFileAndLine
                    .get(suggestion.filePath)
                    .get(suggestion.mappedStartLine)
                    .push(suggestion)
            }
        }
        vscode.commands.executeCommand(
            'setContext',
            'discopop.suggestionsAvailable',
            true
        )
        this._refresh()
    }
}
