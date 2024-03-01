import * as vscode from 'vscode'
import { Commands } from '../../utils/Commands'
import {
    HotspotTreeDataProvider,
    HotspotTreeItem,
} from './HotspotTreeDataProvider'
import { CombinedHotspot } from '../../results/resultStore/CombinedHotspot'

export interface HotspotTreeViewCallbacks {
    uiShowSingleHotspot: (hotspot: CombinedHotspot) => void
}

export class HotspotTreeView {
    private _hotspotTreeDataProvider: HotspotTreeDataProvider
    private _treeView: vscode.TreeView<HotspotTreeItem>

    public constructor(
        context: vscode.ExtensionContext,
        private callbacks: HotspotTreeViewCallbacks
    ) {
        this._hotspotTreeDataProvider = new HotspotTreeDataProvider()
        this._treeView = vscode.window.createTreeView('sidebar-hotspots-view', {
            treeDataProvider: this._hotspotTreeDataProvider,
        })
        context.subscriptions.push(this._treeView)

        context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.showHotspotDetails,
                (hotspot: CombinedHotspot) => {
                    this.callbacks.uiShowSingleHotspot(hotspot)
                }
            )
        )
    }

    public set combinedHotspots(
        combinedHotspots: Map<string, CombinedHotspot[]>
    ) {
        this._hotspotTreeDataProvider.combinedHotspots = combinedHotspots
    }

    // TODO provide a method to refresh the tree view when the data in the map changes (e.g. appliedStatus changed)
}
