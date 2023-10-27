import * as vscode from 'vscode'
import { Suggestion } from './classes/Suggestion/Suggestion'
import { FileMapping } from '../FileMapping/FileMapping'
import { DiscoPoPResults } from './classes/DiscoPoPResults'
import { Commands } from '../Utils/Commands'

export interface DiscoPoPSuggestionTreeNode {
    /** Returns the view for this tree node */
    getView(fileMapping: FileMapping): vscode.TreeItem

    /** Returns the children of the node.
     * @returns array of children nodes (empty if there are none) or undefined if node is a leaf node.
     */
    getChildren(): DiscoPoPSuggestionTreeNode[] | undefined
}

/**
 * A suggestion group is a group of suggestions of the same type.
 * (an inner node of the tree)
 * In the future we might also want to group suggestions by file.
 */
class DiscoPoPSuggestionGroup implements DiscoPoPSuggestionTreeNode {
    label: string
    children: DiscoPoPSuggestionGroup[] | DiscoPoPSuggestionNode[]

    public constructor(label: string, children: Suggestion[]) {
        this.label = label
        this.children = children.map(
            (child) => new DiscoPoPSuggestionNode(child)
        )
    }

    public getView(_fileMapping: FileMapping): vscode.TreeItem {
        const view = new vscode.TreeItem(
            this.label + ' (' + this.children.length + ')',
            vscode.TreeItemCollapsibleState.Collapsed
        )
        view.contextValue = 'suggestion_group'
        return view
    }

    public getChildren(): DiscoPoPSuggestionTreeNode[] | undefined {
        return this.children
    }
}

/**
 * A suggestion node represents a single suggestion.
 * (a leaf node of the tree)
 */
class DiscoPoPSuggestionNode implements DiscoPoPSuggestionTreeNode {
    public constructor(public suggestion: Suggestion) {}

    public getView(fileMapping: FileMapping): vscode.TreeItem {
        const view = new vscode.TreeItem(
            this.suggestion.id,
            vscode.TreeItemCollapsibleState.None
        )
        const filePath = fileMapping.getFilePath(this.suggestion.fileId)
        const fileName = filePath.split('/').pop()
        view.resourceUri = vscode.Uri.file(filePath) // TODO is this good?
        view.description = `${fileName}:${this.suggestion.startLine}`
        view.tooltip =
            filePath +
            ':' +
            this.suggestion.startLine +
            '\n' +
            this.suggestion.pragma
        view.iconPath = new vscode.ThemeIcon('lightbulb')
        view.contextValue = 'suggestion'
        view.command = {
            command: Commands.showSuggestionDetails,
            title: 'Show Suggestion Details',
            arguments: [this.suggestion, fileMapping],
        }
        return view
    }

    public getChildren(): DiscoPoPSuggestionTreeNode[] | undefined {
        return undefined
    }
}

export class SuggestionTree
    implements vscode.TreeDataProvider<DiscoPoPSuggestionTreeNode>
{
    private fileMapping: FileMapping
    private nodes: DiscoPoPSuggestionGroup[] = []

    public constructor(
        fileMapping: FileMapping,
        discoPoPResults: DiscoPoPResults
    ) {
        this.fileMapping = fileMapping
        Array.from(discoPoPResults.suggestionsByType.entries()).forEach(
            ([type, suggestions]) => {
                this.nodes.push(new DiscoPoPSuggestionGroup(type, suggestions))
            }
        )
    }

    // TreeDataProvider implementation
    private _onDidChangeTreeData: vscode.EventEmitter<
        DiscoPoPSuggestionTreeNode | undefined | null | void
    > = new vscode.EventEmitter<
        DiscoPoPSuggestionTreeNode | undefined | null | void
    >()
    readonly onDidChangeTreeData: vscode.Event<
        void | DiscoPoPSuggestionTreeNode | DiscoPoPSuggestionTreeNode[]
    > = this._onDidChangeTreeData.event

    getTreeItem(
        element: DiscoPoPSuggestionTreeNode
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element.getView(this.fileMapping)
    }

    getChildren(
        element?: DiscoPoPSuggestionTreeNode
    ): vscode.ProviderResult<DiscoPoPSuggestionTreeNode[]> {
        if (!element) {
            return this.nodes
        } else {
            return element.getChildren()
        }
    }

    // getParent?(element: SuggestionTreeNode): vscode.ProviderResult<SuggestionTreeNode> {
    //     throw new Error('Method not implemented.');
    // }

    // resolveTreeItem?(item: vscode.TreeItem, element: SuggestionTreeNode, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
    //     throw new Error('Method not implemented.');
    // }
}
