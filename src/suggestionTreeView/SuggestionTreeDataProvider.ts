import * as vscode from 'vscode'
import { CombinedSuggestion } from '../dpResults/CombinedSuggestion'

export type SuggestionTreeItem = string | CombinedSuggestion
export class SuggestionTreeDataProvider
    implements vscode.TreeDataProvider<SuggestionTreeItem>
{
    public constructor() {}

    private _combinedSuggestions: Map<string, CombinedSuggestion[]> = undefined
    public set combinedSuggestions(
        combinedSuggestions: Map<string, CombinedSuggestion[]>
    ) {
        this._combinedSuggestions = combinedSuggestions
        this.refresh()
    }

    // trigger updates of the tree view
    private _onDidChangeTreeData: vscode.EventEmitter<
        SuggestionTreeItem | undefined | null | void
    > = new vscode.EventEmitter<SuggestionTreeItem | undefined | null | void>()
    public readonly onDidChangeTreeData: vscode.Event<
        void | SuggestionTreeItem | SuggestionTreeItem[]
    > = this._onDidChangeTreeData.event
    private refresh(): void {
        // Possibly make it public
        this._onDidChangeTreeData.fire()
    }

    public getTreeItem(
        element: SuggestionTreeItem
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (typeof element === 'string') {
            const treeItem = new vscode.TreeItem(
                element,
                vscode.TreeItemCollapsibleState.Collapsed
            )
            // TODO styling etc. (maybe put this in a separate class that extends TreeItem?)
            return treeItem
        }

        const combinedSuggestion = element as CombinedSuggestion
        const treeItem = new vscode.TreeItem(
            String(combinedSuggestion.patternID)
        )
        // TODO styling etc. (maybe put this in a separate class that extends TreeItem?)
        return treeItem
    }
    public getChildren(
        element?: SuggestionTreeItem
    ): vscode.ProviderResult<SuggestionTreeItem[]> {
        if (element === undefined) {
            if (this._combinedSuggestions === undefined) {
                return []
            }
            return Array.from(this._combinedSuggestions.keys())
        }
        if (typeof element === 'string') {
            return Array.from(this._combinedSuggestions.get(element))
        }
        console.error(
            'SuggestionTreeDataProvider::getChildren called with invalid element'
        )
        return undefined
    }
    public getParent?(
        element: SuggestionTreeItem
    ): vscode.ProviderResult<SuggestionTreeItem> {
        if (typeof element === 'string') {
            return undefined
        }
        return element.type
    }
    // resolveTreeItem?
}
