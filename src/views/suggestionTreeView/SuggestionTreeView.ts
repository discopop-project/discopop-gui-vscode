import * as vscode from 'vscode'
import { CombinedSuggestion } from '../../resultStore/CombinedSuggestion'
import { Commands } from '../../utils/Commands'
import {
    SuggestionTreeDataProvider,
    SuggestionTreeItem,
} from './SuggestionTreeDataProvider'

export interface SuggestionTreeViewCallbacks {
    uiShowSingleSuggestion(suggestion: CombinedSuggestion): void
    uiPreviewSuggestion(suggestion: CombinedSuggestion): void
    applySuggestion(suggestion: CombinedSuggestion): void
    rollbackSuggestion(suggestion: CombinedSuggestion): void
    rollbackAllSuggestions(): void
    createInteractiveExport(): void
}

export class SuggestionTreeView {
    private _suggestionTreeDataProvider: SuggestionTreeDataProvider
    private _treeView: vscode.TreeView<SuggestionTreeItem>

    private static _instance: SuggestionTreeView
    public static create(
        context: vscode.ExtensionContext,
        callbacks: SuggestionTreeViewCallbacks
    ): SuggestionTreeView {
        if (SuggestionTreeView._instance) {
            console.error(
                'SuggestionTreeView already created. Only call SuggestionTreeView.create once!'
            )
            return SuggestionTreeView._instance
        }
        return new SuggestionTreeView(context, callbacks)
    }
    private constructor(
        context: vscode.ExtensionContext,
        private callbacks: SuggestionTreeViewCallbacks
    ) {
        this._suggestionTreeDataProvider = new SuggestionTreeDataProvider()
        this._treeView = vscode.window.createTreeView(
            'sidebar-suggestions-view',
            { treeDataProvider: this._suggestionTreeDataProvider }
        )
        context.subscriptions.push(this._treeView)

        // hide the buttons on the top of the tree view until we actually have suggestions
        vscode.commands.executeCommand(
            'setContext',
            'discopop.suggestionsAvailable',
            false
        )

        context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.showSuggestionDetails,
                (suggestion: CombinedSuggestion) => {
                    this.callbacks.uiShowSingleSuggestion(suggestion)
                }
            )
        )

        context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.applySingleSuggestion,
                async (suggestion: CombinedSuggestion) => {
                    callbacks.applySuggestion(suggestion)
                }
            )
        )

        context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.rollbackSingleSuggestion,
                async (suggestion: CombinedSuggestion) => {
                    callbacks.rollbackSuggestion(suggestion)
                }
            )
        )

        context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.previewSuggestion,
                async (suggestion: CombinedSuggestion) => {
                    callbacks.uiPreviewSuggestion(suggestion)
                }
            )
        )

        context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.markSuggestionForInteractiveExport,
                async (suggestion: CombinedSuggestion) => {
                    suggestion.markedForExport = !suggestion.markedForExport
                    console.log(
                        'suggestion ' +
                            suggestion.patternID +
                            ' marked for export: ' +
                            suggestion.markedForExport
                    )
                    this._suggestionTreeDataProvider.refresh(suggestion)
                }
            )
        )

        context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.rollbackAllSuggestions,
                async () => {
                    callbacks.rollbackAllSuggestions()
                }
            )
        )

        context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.createInteractiveExport,
                async () => {
                    callbacks.createInteractiveExport()
                }
            )
        )

        // TODO filtering / sorting of suggestions
        // context.subscriptions.push(
        //     vscode.commands.registerCommand(
        //         Commands.filterSuggestions,
        //         async () => {
        //             throw new Error('filterSuggestions not implemented')
        //             // TODO
        //         }
        //     )
        // )

        // TODO renaming of suggestions
    }

    public set combinedSuggestions(
        combinedSuggestions: Map<string, CombinedSuggestion[]>
    ) {
        this._suggestionTreeDataProvider.combinedSuggestions =
            combinedSuggestions
        // enables the buttons on the top of the tree view
        vscode.commands.executeCommand(
            'setContext',
            'discopop.suggestionsAvailable',
            true
        )
    }
}
