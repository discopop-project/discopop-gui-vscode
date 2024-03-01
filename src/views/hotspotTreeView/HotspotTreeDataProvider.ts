import * as vscode from 'vscode'
import { CombinedHotspot } from '../../dpResults/resultManager/CombinedHotspot'
import { Commands } from '../../utils/Commands'

// TODO a lot of similarity with SuggestionTreeDataProvider
// TODO maybe extract common functionality into a MapBasedTreeDataProvider class

export type HotspotTreeItem = string | CombinedHotspot
export class HotspotTreeDataProvider
    implements vscode.TreeDataProvider<HotspotTreeItem>
{
    public constructor() {}

    private _combinedHotspots: Map<string, CombinedHotspot[]> = undefined
    public set combinedHotspots(
        combinedHotspots: Map<string, CombinedHotspot[]>
    ) {
        this._combinedHotspots = combinedHotspots
        this.refresh()
    }

    // trigger updates of the tree view
    private _onDidChangeTreeData: vscode.EventEmitter<
        HotspotTreeItem | undefined | null | void
    > = new vscode.EventEmitter<HotspotTreeItem | undefined | null | void>()
    public readonly onDidChangeTreeData: vscode.Event<
        void | HotspotTreeItem | HotspotTreeItem[]
    > = this._onDidChangeTreeData.event
    private refresh(): void {
        // Possibly make it public
        this._onDidChangeTreeData.fire()
    }

    getTreeItem(
        element: HotspotTreeItem
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (typeof element === 'string') {
            const treeItem = new vscode.TreeItem(
                element,
                vscode.TreeItemCollapsibleState.Collapsed
            )
            // TODO styling etc. (maybe put this in a separate class that extends TreeItem?)
            return treeItem
        }

        const treeItem = new vscode.TreeItem(
            `${element.filePath}:${element.startLine}`
        )
        treeItem.command = {
            command: Commands.showHotspotDetails,
            title: 'Show Hotspot Details',
            arguments: [element],
        }
        // TODO styling etc. (maybe put this in a separate class that extends TreeItem?)
        return treeItem
    }
    getChildren(
        element?: HotspotTreeItem
    ): vscode.ProviderResult<HotspotTreeItem[]> {
        if (element === undefined) {
            if (this._combinedHotspots === undefined) {
                return []
            }
            return Array.from(this._combinedHotspots.keys())
        }
        if (typeof element === 'string') {
            return Array.from(this._combinedHotspots.get(element))
        }
        // combinedHotspot has no children
        return undefined
    }
    getParent?(
        element: HotspotTreeItem
    ): vscode.ProviderResult<HotspotTreeItem> {
        if (typeof element === 'string') {
            return undefined
        }
        return element.type
    }
    // resolveTreeItem?(item: vscode.TreeItem, element: HotspotTreeItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
}
