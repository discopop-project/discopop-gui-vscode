import * as vscode from 'vscode'
import { Suggestion } from './classes/Suggestion/Suggestion'
import { FileMapping } from '../FileMapping/FileMapping'
import { DiscoPoPResults } from './classes/DiscoPoPResults'
import { Commands } from '../Utils/Commands'
import { SimpleTree, SimpleTreeNode } from '../Utils/SimpleTree'

/**
 * A suggestion group is a group of suggestions of the same type.
 * (an inner node of the tree)
 * In the future we might also want to group suggestions by file.
 */
export class DiscoPoPSuggestionGroup
    implements SimpleTreeNode<DiscoPoPSuggestionGroup | DiscoPoPSuggestionNode>
{
    label: string
    children: DiscoPoPSuggestionGroup[] | DiscoPoPSuggestionNode[]
    fileMapping: FileMapping

    public constructor(
        label: string,
        children: Suggestion[],
        fileMapping: FileMapping
    ) {
        this.label = label
        this.children = children.map(
            (child) => new DiscoPoPSuggestionNode(child, fileMapping)
        )
        this.fileMapping = fileMapping
    }

    public getView(): vscode.TreeItem {
        const view = new vscode.TreeItem(
            this.label + ' (' + this.children.length + ')',
            vscode.TreeItemCollapsibleState.Collapsed
        )
        view.contextValue = 'suggestion_group'
        return view
    }

    public getChildren(): (DiscoPoPSuggestionGroup | DiscoPoPSuggestionNode)[] {
        return this.children
    }
}

/**
 * A suggestion node represents a single suggestion.
 * (a leaf node of the tree)
 */
export class DiscoPoPSuggestionNode implements SimpleTreeNode<undefined> {
    public constructor(
        public readonly suggestion: Suggestion,
        public readonly fileMapping: FileMapping
    ) {}

    public getView(): vscode.TreeItem {
        const view = new vscode.TreeItem(
            this.suggestion.id,
            vscode.TreeItemCollapsibleState.None
        )
        const filePath = this.fileMapping.getFilePath(this.suggestion.fileId)
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
            arguments: [this.suggestion, this.fileMapping],
        }
        return view
    }

    public getChildren(): undefined {
        return undefined
    }
}

export class SuggestionTree extends SimpleTree<
    DiscoPoPSuggestionGroup | DiscoPoPSuggestionNode
> {
    public constructor(
        fileMapping: FileMapping,
        discoPoPResults: DiscoPoPResults
    ) {
        const nodes: DiscoPoPSuggestionGroup[] = []
        Array.from(discoPoPResults.suggestionsByType.entries()).forEach(
            ([type, suggestions]) => {
                nodes.push(
                    new DiscoPoPSuggestionGroup(type, suggestions, fileMapping)
                )
            }
        )
        super(nodes)
    }
}
