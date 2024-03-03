import * as vscode from 'vscode'
import { CombinedSuggestion } from '../resultStore/CombinedSuggestion'
import { Commands } from '../utils/Commands'

export interface DiscoPoPCodeLensProviderCallbacks {
    /** called by the DiscoPoPCodeLensProvider */
    toggleGlobalCodeLensSetting: () => void
    /** called by the DiscoPoPCodeLensProvider */
    getGlobalCodeLensSetting: () => boolean
}

export class DiscoPoPCodeLensProvider implements vscode.CodeLensProvider {
    private static _instance: DiscoPoPCodeLensProvider

    private constructor(private callbacks: DiscoPoPCodeLensProviderCallbacks) {}

    public static create(
        _context: vscode.ExtensionContext,
        _callbacks: DiscoPoPCodeLensProviderCallbacks
    ) {
        if (DiscoPoPCodeLensProvider._instance !== undefined) {
            console.error(
                'DiscoPoPCodeLensProvider already created. Only call create once!'
            )
            return DiscoPoPCodeLensProvider._instance
        }

        DiscoPoPCodeLensProvider._instance = new DiscoPoPCodeLensProvider(
            _callbacks
        )
        _context.subscriptions.push(
            vscode.languages.registerCodeLensProvider(
                { scheme: 'file', language: 'cpp' },
                this._instance
            )
        )

        _context.subscriptions.push(
            vscode.commands.registerCommand(Commands.toggleCodeLens, () => {
                _callbacks.toggleGlobalCodeLensSetting()
            })
        )

        _context.subscriptions.push(
            vscode.commands.registerCommand(Commands.enableCodeLens, () => {
                DiscoPoPCodeLensProvider._instance.show()
            })
        )

        _context.subscriptions.push(
            vscode.commands.registerCommand(Commands.disableCodeLens, () => {
                DiscoPoPCodeLensProvider._instance.hide()
            })
        )

        // TODO register commands for the lenses, then use the callbacks

        // hide the button to turn on/off code lenses
        vscode.commands.executeCommand(
            'setContext',
            'discopop.codeLensEnabled',
            'undefined' // 'undefined'|'enabled'|'disabled' -> no button|button to hide|button to show
        )

        return DiscoPoPCodeLensProvider._instance
    }

    // show or hide the code lenses
    private _hidden: boolean = false
    public show() {
        this._hidden = false
        vscode.commands.executeCommand(
            'setContext',
            'discopop.codeLensEnabled',
            'enabled'
        )
        this._refresh()
    }
    public hide() {
        this._hidden = true
        vscode.commands.executeCommand(
            'setContext',
            'discopop.codeLensEnabled',
            'disabled'
        )
        this._refresh()
    }

    // event system to tell vscode that the code lenses have changed
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
        new vscode.EventEmitter<void>()
    public onDidChangeCodeLenses?: vscode.Event<void> =
        this._onDidChangeCodeLenses.event
    private _refresh() {
        this._onDidChangeCodeLenses.fire()
    }

    // called by vscode to provide code lenses
    public provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CodeLens[]> {
        // if globally disabled: return empty array
        if (!this.callbacks.getGlobalCodeLensSetting()) {
            console.log('code lenses globally disabled, not showing any')
            return []
        }

        // if locally disabled: return empty array
        if (this._hidden) {
            console.log('code lenses locally disabled, not showing any')
            return []
        }

        console.log('providing code lenses')

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
            'discopop.codeLensEnabled',
            this._hidden ? 'disabled' : 'enabled'
        )

        this._refresh()
    }
}
