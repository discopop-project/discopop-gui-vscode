import * as vscode from 'vscode'
import { FileMapping } from '../discopop/model/FileMapping'
import { Hotspot } from '../discopop/model/Hotspot'
import { HotspotDetectionResults } from '../discopop/model/HotspotDetectionResults'
import { LineMapping } from '../discopop/model/LineMapping'
import { Commands } from '../utils/Commands'
import { SimpleTree, SimpleTreeNode } from '../utils/SimpleTree'

// inner nodes
export class HotspotGroup
    implements SimpleTreeNode<HotspotGroup | HotspotNode>
{
    public constructor(
        public readonly type: 'YES' | 'NO' | 'MAYBE',
        public readonly hotspots: Hotspot[],
        public readonly fileMapping: FileMapping
    ) {}
    getView(): vscode.TreeItem {
        return new vscode.TreeItem(
            `${this.type} (${this.hotspots.length})`,
            vscode.TreeItemCollapsibleState.Collapsed
        )
    }
    getChildren(): (HotspotGroup | HotspotNode)[] {
        return this.hotspots.map(
            (hotspot) => new HotspotNode(hotspot, this.fileMapping)
        )
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
        lineMapping: LineMapping,
        hotspotDetectionResults: HotspotDetectionResults
    ) {
        const groups = hotspotDetectionResults.hotspots
            .sort((a, b) => a.avr - b.avr)
            .reduce(
                (acc, node) => {
                    const group = node.hotness
                    acc[group].push(node)
                    return acc
                },
                {
                    YES: [] as Hotspot[],
                    NO: [] as Hotspot[],
                    MAYBE: [] as Hotspot[],
                }
            )
        super([
            new HotspotGroup(
                'YES',
                groups.YES,
                hotspotDetectionResults.fileMapping
            ),
            new HotspotGroup(
                'NO',
                groups.NO,
                hotspotDetectionResults.fileMapping
            ),
            new HotspotGroup(
                'MAYBE',
                groups.MAYBE,
                hotspotDetectionResults.fileMapping
            ),
        ])
    }
}
