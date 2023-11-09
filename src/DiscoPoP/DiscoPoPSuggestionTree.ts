import * as vscode from 'vscode'
import { Suggestion } from './classes/Suggestion/Suggestion'
import { FileMapping } from '../FileMapping/FileMapping'
import { Commands } from '../Utils/Commands'
import { SimpleTree, SimpleTreeNode } from '../Utils/SimpleTree'
import { DefaultConfiguration } from '../ProjectManager/Configuration'
import { DiscoPoPResults } from './DiscoPoPRunner'

/**
 * A suggestion group is a group of suggestions of the same type.
 * (an inner node of the tree)
 * In the future we might also want to group suggestions by file.
 */
export class DiscoPoPSuggestionGroup
    implements SimpleTreeNode<DiscoPoPSuggestionGroup | DiscoPoPSuggestionNode>
{
    public constructor(
        public label: string,
        public children: DiscoPoPSuggestionGroup[] | DiscoPoPSuggestionNode[]
    ) {
        this.label = label
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
        public file: string
    ) {}

    public getView(): vscode.TreeItem {
        const view = new vscode.TreeItem(
            `${this.suggestion.id}`,
            vscode.TreeItemCollapsibleState.None
        )
        const fileName = this.file.split('/').pop()
        view.resourceUri = vscode.Uri.file(this.file) // TODO is this good?
        view.description = `${fileName}:${this.suggestion.startLine}`
        view.tooltip = this.file + ':' + this.suggestion.startLine
        view.iconPath = new vscode.ThemeIcon('lightbulb')
        view.contextValue = 'suggestion'
        view.command = {
            command: Commands.showSuggestionDetails,
            title: 'Show Suggestion Details',
            arguments: [this.suggestion.id],
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
    public constructor(discoPoPResults: DiscoPoPResults) {
        const nodes: DiscoPoPSuggestionGroup[] = []
        Array.from(discoPoPResults.suggestionsByType.entries()).forEach(
            ([type, suggestions]) => {
                nodes.push(
                    new DiscoPoPSuggestionGroup(
                        type,
                        suggestions.map((suggestion) => {
                            return new DiscoPoPSuggestionNode(
                                suggestion,
                                discoPoPResults.fileMapping.getFilePath(
                                    suggestion.fileId
                                )
                            )
                        })
                    )
                )
            }
        )
        super(nodes)
    }
}
