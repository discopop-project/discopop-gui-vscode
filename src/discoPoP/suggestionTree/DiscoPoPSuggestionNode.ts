import * as vscode from 'vscode'
import { Commands } from '../../utils/Commands'
import { SimpleTreeNode } from '../../utils/SimpleTree'
import { Suggestion } from '../classes/Suggestion/Suggestion'

/**
 * A suggestion node represents a single suggestion.
 * (a leaf node of the tree)
 */
export class DiscoPoPSuggestionNode implements SimpleTreeNode<undefined> {
    public constructor(
        public readonly suggestion: Suggestion,
        public file: string,
        applied: boolean
    ) {
        this.view = new vscode.TreeItem(
            `${this.suggestion.id}`,
            vscode.TreeItemCollapsibleState.None
        )
        const fileName = this.file.split('/').pop()
        this.view.resourceUri = vscode.Uri.file(this.file) // TODO is this good?
        this.view.description = `${fileName}:${this.suggestion.startLine}`
        this.view.tooltip = this.file + ':' + this.suggestion.startLine
        this.view.command = {
            command: Commands.showSuggestionDetails,
            title: 'Show Suggestion Details',
            arguments: [this.suggestion.id],
        }
        this.setApplied(applied)
    }

    public view: vscode.TreeItem

    public getView(): vscode.TreeItem {
        return this.view
    }

    public setApplied(applied: boolean): void {
        if (applied) {
            this.view.iconPath = new vscode.ThemeIcon('verified-filled')
            this.view.contextValue = 'suggestion_applied'
        } else {
            this.view.iconPath = new vscode.ThemeIcon('lightbulb')
            this.view.contextValue = 'suggestion'
        }
    }

    public getChildren(): undefined {
        return undefined
    }
}
