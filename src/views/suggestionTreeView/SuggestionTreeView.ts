import * as vscode from 'vscode'
import { CombinedSuggestion } from '../../results/combinedResults/CombinedSuggestion'
import { Commands } from '../../utils/Commands'
import {
    SuggestionTreeDataProvider,
    SuggestionTreeItem,
} from './SuggestionTreeDataProvider'

export interface SuggestionTreeViewCallbacks {
    uiShowSingleSuggestion: (suggestion: CombinedSuggestion) => void
}

export class SuggestionTreeView {
    private _suggestionTreeDataProvider: SuggestionTreeDataProvider
    private _treeView: vscode.TreeView<SuggestionTreeItem>

    public constructor(
        context: vscode.ExtensionContext,
        private callbacks: SuggestionTreeViewCallbacks
    ) {
        this._suggestionTreeDataProvider = new SuggestionTreeDataProvider()
        this._treeView = vscode.window.createTreeView(
            'sidebar-suggestions-view',
            { treeDataProvider: this._suggestionTreeDataProvider }
        )
        context.subscriptions.push(this._treeView)

        context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.showSuggestionDetails,
                (suggestion: CombinedSuggestion) => {
                    this.callbacks.uiShowSingleSuggestion(suggestion)
                }
            )
        )
    }

    public set combinedSuggestions(
        combinedSuggestions: Map<string, CombinedSuggestion[]>
    ) {
        this._suggestionTreeDataProvider.combinedSuggestions =
            combinedSuggestions
    }

    // TODO provide a method to refresh the tree view when the data in the map changes (e.g. appliedStatus changed)
}
