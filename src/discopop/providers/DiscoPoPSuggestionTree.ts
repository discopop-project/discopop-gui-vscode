import * as vscode from 'vscode'
import { Commands } from '../../utils/Commands'
import { SimpleTree, SimpleTreeNode } from '../../utils/SimpleTree'
import { DiscoPoPAppliedSuggestionsWatcher } from '../model/DiscoPoPAppliedSuggestionsWatcher'
import { DiscoPoPResults } from '../model/DiscoPoPResults'
import { DiscoPoPSuggestion } from '../model/DiscoPoPSuggestion'

export class SuggestionTree extends SimpleTree<
    DiscoPoPSuggestionGroup | DiscoPoPSuggestionNode
> {
    public constructor(private _discoPoPResults: DiscoPoPResults) {
        super([])
        this.replaceData(_discoPoPResults)
    }

    private _appliedStatusCallback = (appliedStatus) => {
        this.updateAppliedStatus(appliedStatus)
    }

    private all_roots: DiscoPoPSuggestionGroup[] = []
    public replaceData(discoPoPResults: DiscoPoPResults): void {
        this._discoPoPResults?.appliedStatus?.offDidChange(
            this._appliedStatusCallback
        )
        this._discoPoPResults = discoPoPResults
        this.all_roots = Array.from(
            discoPoPResults.suggestionsByType.entries()
        ).map(([type, suggestions]) => {
            return new DiscoPoPSuggestionGroup(
                type,
                suggestions.map((suggestion) => {
                    return new DiscoPoPSuggestionNode(
                        suggestion,
                        discoPoPResults.fileMapping.getFilePath(
                            suggestion.fileId
                        ),
                        discoPoPResults.appliedStatus.isApplied(suggestion.id)
                    )
                })
            )
        })
        discoPoPResults.appliedStatus.onDidChange(this._appliedStatusCallback)
        this._applyFilter()
        this.refresh()
    }

    // default filter: shows all suggestions which are NOT marked with applicable_pattern=false in patterns.json
    private _filter: (
        node: DiscoPoPSuggestionGroup | DiscoPoPSuggestionNode
    ) => boolean = (node) =>
        node instanceof DiscoPoPSuggestionGroup
            ? true
            : node.suggestion.applicable_pattern

    /** supply a filter function to remove some of the suggestions from the view */
    public filter(
        filter: (
            node: DiscoPoPSuggestionNode | DiscoPoPSuggestionGroup
        ) => boolean
    ): void {
        this._filter = filter
        this._applyFilter()
        this.refresh()
    }

    private _applyFilter(): void {
        this.roots = this.all_roots.map((root) => {
            const children = root.children.filter(this._filter)
            return new DiscoPoPSuggestionGroup(root.label, children)
        })

        // remove empty groups on the top level
        this.roots = this.roots.filter(
            (root) =>
                root instanceof DiscoPoPSuggestionNode ||
                root.children.length > 0
        )
    }

    public refresh(): void {
        super.refresh()
    }

    public get countVisible(): number {
        let count = 0
        const stack = []
        this.roots.forEach((root) => {
            stack.push(root)
        })
        let item
        while ((item = stack.pop()) !== undefined) {
            if (item instanceof DiscoPoPSuggestionNode) {
                count++
            } else {
                item.children.forEach((child) => {
                    stack.push(child)
                })
            }
        }
        return count
    }

    /** does not consider patterns that are marked with applicable_pattern=false in patterns.json */
    public get countTotalApplicable(): number {
        return this._discoPoPResults.countApplicable
    }

    public updateAppliedStatus(
        appliedStatus: DiscoPoPAppliedSuggestionsWatcher
    ) {
        this.roots.forEach((root) => {
            this._callCallbackForAllNodes(root, (node) => {
                if (node instanceof DiscoPoPSuggestionNode) {
                    node.setApplied(appliedStatus.isApplied(node.suggestion.id))
                }
            })
        })
        this.refresh()
    }

    private _callCallbackForAllNodes(
        node: DiscoPoPSuggestionGroup | DiscoPoPSuggestionNode,
        callback: (
            node: DiscoPoPSuggestionGroup | DiscoPoPSuggestionNode
        ) => void
    ): void {
        callback(node)
        if (node instanceof DiscoPoPSuggestionGroup) {
            node.children.forEach((child) => {
                this._callCallbackForAllNodes(child, callback)
            })
        }
    }
}

/**
 * A suggestion node represents a single suggestion.
 * (a leaf node of the tree)
 */

export class DiscoPoPSuggestionNode implements SimpleTreeNode<undefined> {
    public constructor(
        public readonly suggestion: DiscoPoPSuggestion,
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
        return this.children
    }
}
