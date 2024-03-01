import * as vscode from 'vscode'
import { CombinedSuggestion } from '../dpResults/CombinedSuggestion'
import {
    SuggestionTreeDataProvider,
    SuggestionTreeItem,
} from './SuggestionTreeDataProvider'

export class SuggestionTreeView {
    private _suggestionTreeDataProvider: SuggestionTreeDataProvider
    private _treeView: vscode.TreeView<SuggestionTreeItem>

    public constructor(context: vscode.ExtensionContext) {
        this._suggestionTreeDataProvider = new SuggestionTreeDataProvider()
        this._treeView = vscode.window.createTreeView(
            'sidebar-suggestions-view',
            { treeDataProvider: this._suggestionTreeDataProvider }
        )
        context.subscriptions.push(this._treeView)
    }

    public set combinedSuggestions(
        combinedSuggestions: Map<string, CombinedSuggestion[]>
    ) {
        this._suggestionTreeDataProvider.combinedSuggestions =
            combinedSuggestions
    }

    // TODO provide a method to refresh the tree view when the data in the map changes (e.g. appliedStatus changed)
}
