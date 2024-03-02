import * as vscode from 'vscode'
import { CombinedSuggestion } from '../../resultStore/CombinedSuggestion'
import { Commands } from '../../utils/Commands'

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
        console.log('refreshing tree view')
        // Possibly make it public
        this._onDidChangeTreeData.fire()
    }

    public getTreeItem(
        element: SuggestionTreeItem
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (typeof element === 'string') {
            // create a pretty view for a suggestion group
            // TODO maybe put this in a separate class that extends TreeItem
            const treeItem = new vscode.TreeItem(
                element +
                    ' (' +
                    this._combinedSuggestions.get(element).length +
                    ')',
                vscode.TreeItemCollapsibleState.Collapsed
            )
            treeItem.contextValue = 'suggestion_group'
            return treeItem
        }

        // create a pretty view for a suggestion
        // TODO maybe put this in a separate class that extends TreeItem
        const treeItem = new vscode.TreeItem(String(element.patternID))
        const fileName = element.filePath.split('/').pop()
        treeItem.resourceUri = vscode.Uri.file(element.filePath) // TODO is this good?
        treeItem.description = `${fileName}:${element.mappedStartLine}`
        treeItem.tooltip = element.filePath + ':' + element.mappedStartLine
        treeItem.command = {
            command: Commands.showSuggestionDetails,
            title: 'Show Suggestion Details',
            arguments: [element],
        }
        if (element.applied) {
            treeItem.iconPath = new vscode.ThemeIcon('verified-filled')
            treeItem.contextValue = 'suggestion_applied'
        } else {
            treeItem.iconPath = new vscode.ThemeIcon('lightbulb')
            treeItem.contextValue = 'suggestion'
        }

        return treeItem
    }
    public getChildren(
        element?: SuggestionTreeItem
    ): vscode.ProviderResult<SuggestionTreeItem[]> {
        if (element === undefined) {
            if (this._combinedSuggestions === undefined) {
                return []
            }
            const keys = Array.from(this._combinedSuggestions.keys())
            const filteredKeys = keys.filter(
                (key) =>
                    this._combinedSuggestions
                        .get(key)
                        .filter((s) => s.applicable).length > 0
            )
            return filteredKeys
        }
        if (typeof element === 'string') {
            return Array.from(
                this._combinedSuggestions
                    .get(element)
                    .filter((s) => s.applicable)
            )
        }
        // combinedSuggestion has no children
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
