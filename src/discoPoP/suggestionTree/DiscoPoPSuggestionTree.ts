import { SimpleTree } from '../../utils/SimpleTree'
import { DiscoPoPAppliedSuggestionsWatcher } from '../DiscoPoPAppliedSuggestionsWatcher'
import { DiscoPoPResults } from '../classes/DiscoPoPResults'
import { DiscoPoPSuggestionGroup } from './DiscoPoPSuggestionGroup'
import { DiscoPoPSuggestionNode } from './DiscoPoPSuggestionNode'

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
