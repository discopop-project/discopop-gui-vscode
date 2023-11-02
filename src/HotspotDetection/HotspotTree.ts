import * as vscode from 'vscode'
import { SimpleTree, SimpleTreeNode } from '../Utils/TreeViews'
import { FileMapping } from '../FileMapping/FileMapping'
import { HotspotDetectionResults } from './HotspotDetectionResults'
import { Hotspot } from './classes/Hotspot'
import { Commands } from '../Utils/Commands'

// inner nodes
export class HotspotGroup
    implements SimpleTreeNode<HotspotGroup | HotspotNode>
{
    getView(): vscode.TreeItem {
        throw new Error('Method not implemented.')
    }
    getChildren(): (HotspotGroup | HotspotNode)[] {
        throw new Error('Method not implemented.')
    }
}

// leaf nodes
export class HotspotNode implements SimpleTreeNode<undefined> {
    public constructor(
        public readonly hotspot: Hotspot,
        public readonly fileMapping: FileMapping
    ) {}

    getView(): vscode.TreeItem {
        const view = new vscode.TreeItem(
            this.hotspot.hotness,
            vscode.TreeItemCollapsibleState.None
        )
        const filePath = this.fileMapping.getFilePath(this.hotspot.fid)
        const fileName = filePath.split('/').pop()
        view.description = `${fileName}:${this.hotspot.lineNum}`
        view.command = {
            command: Commands.showHotspotDetails,
            title: 'Show Hotspot Details',
            arguments: [this.hotspot, this.fileMapping],
        }

        return view
    }
    getChildren(): undefined {
        return undefined
    }
}

export class HotspotTree extends SimpleTree<HotspotGroup | HotspotNode> {
    constructor(
        fileMapping: FileMapping,
        hotspotDetectionResults: HotspotDetectionResults
    ) {
        // TODO: group by hotness
        const nodes = hotspotDetectionResults.hotspots
            .sort((a, b) => a.avr - b.avr)
            .map((hotspot) => new HotspotNode(hotspot, fileMapping))
        super(nodes)
    }
}
