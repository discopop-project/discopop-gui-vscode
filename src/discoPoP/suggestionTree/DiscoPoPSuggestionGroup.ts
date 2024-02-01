import * as vscode from 'vscode'
import { SimpleTreeNode } from '../../utils/SimpleTree'
import { DiscoPoPSuggestionNode } from './DiscoPoPSuggestionNode'

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
        public children: (DiscoPoPSuggestionGroup | DiscoPoPSuggestionNode)[]
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
        return this.children.filter((child) => {
            const accept =
                child instanceof DiscoPoPSuggestionGroup ||
                child.suggestion.applicable_pattern
            if (!accept) {
                console.log(
                    'Not showing unapplicable suggestion: ' +
                        child.suggestion.id
                )
            }
            return accept
        })
    }
}
