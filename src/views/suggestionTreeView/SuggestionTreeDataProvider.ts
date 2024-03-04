import * as vscode from 'vscode'
import { CombinedSuggestion } from '../../resultStore/CombinedSuggestion'
import { Commands } from '../../utils/Commands'
import { SuggestionFilter } from './SuggestionFilter'

export type SuggestionTreeItem = string | CombinedSuggestion
export class SuggestionTreeDataProvider
    implements vscode.TreeDataProvider<SuggestionTreeItem>
{
    public constructor() {}

    public showSuggestionFilterQuickPick(): Promise<SuggestionFilter[]> {
        return new Promise((resolve, reject) => {
            const quickPick = vscode.window.createQuickPick<SuggestionFilter>()
            quickPick.items = this.availableFilters
            quickPick.selectedItems = this.selectedFilters

            quickPick.canSelectMany = true
            quickPick.title = 'Filter suggestions'
            quickPick.placeholder = 'Select filters to apply'
            quickPick.onDidAccept(() => {
                resolve(Array.from(quickPick.selectedItems))
                quickPick.hide()
            })
            quickPick.onDidHide(() => {
                resolve(undefined)
            })
            // TODO add a button to restore defaults?
            // quickPick.buttons = [
            //     {
            //         iconPath: new vscode.ThemeIcon('clear-all'),
            //         tooltip: 'Reset Filters',
            //     },
            // ]

            // when a filter is inverted, this event is triggered
            quickPick.onDidTriggerItemButton((item) => {
                item.item.toggleInverted()
                // TODO update the item.button properties and show different icons/tooltips if the filter is inverted

                // triggers to refresh the rendering
                const tmp = quickPick.selectedItems
                quickPick.items = quickPick.items
                quickPick.selectedItems = tmp
            })

            quickPick.show()
        })
    }

    public readonly availableFilters: SuggestionFilter[] = [
        new SuggestionFilter(
            (s) => s.applicable,
            'apply',
            'Applicable',
            'Non-Applicable',
            'Show only applicable suggestions',
            'Show only non-applicable suggestions'
        ),
        new SuggestionFilter(
            (s) => s.applied,
            'apply',
            'Applied',
            'Not Applied',
            'Show only applied suggestions',
            'Show only suggestions that are not applied'
        ),
        new SuggestionFilter(
            (s) => s.markedForExport,
            'apply',
            'Marked for Export',
            'Not Marked for Export',
            'Show only suggestions marked for export',
            'Show only suggestions not marked for export'
        ),
    ]
    private _selectedFilters: number[] = [0]
    /** subset of the available filters that is currently selected */
    public get selectedFilters(): readonly SuggestionFilter[] {
        return this._selectedFilters.map((i) => this.availableFilters[i])
    }
    /** subset of the available filters that is currently selected */
    public set selectedFilters(selectedFilters: SuggestionFilter[]) {
        console.log('setting selected filters')
        this._selectedFilters = selectedFilters.map((f) =>
            this.availableFilters.indexOf(f)
        )
        if (this._selectedFilters.includes(-1)) {
            console.error('invalid filter, using defaults instead')
            this._selectedFilters = [0]
        }
        console.log(
            'selected filters: ',
            this._selectedFilters,
            selectedFilters
        )
        this.refresh()
    }

    private _filteredSuggestions: Map<string, CombinedSuggestion[]> = new Map()

    private _combinedSuggestions: Map<string, CombinedSuggestion[]> = undefined
    public set combinedSuggestions(
        combinedSuggestions: Map<string, CombinedSuggestion[]>
    ) {
        this._combinedSuggestions = combinedSuggestions
        this.refresh()
    }

    // trigger updates of the tree view
    private _onDidChangeTreeData: vscode.EventEmitter<
        SuggestionTreeItem | undefined | null | void
    > = new vscode.EventEmitter<SuggestionTreeItem | undefined | null | void>()
    public readonly onDidChangeTreeData: vscode.Event<
        void | SuggestionTreeItem | SuggestionTreeItem[]
    > = this._onDidChangeTreeData.event
    public refresh(item?: SuggestionTreeItem): void {
        console.log('refreshing tree view')
        if (item) {
            // only update the relevant subtree
            this._onDidChangeTreeData.fire(item)
        } else {
            // update the whole tree:
            // filter the suggestions
            this._filteredSuggestions.clear()
            for (const [key, value] of this._combinedSuggestions) {
                this._filteredSuggestions.set(
                    key,
                    value.filter((s) =>
                        this._selectedFilters.every((f) =>
                            this.availableFilters[f].filter(s)
                        )
                    )
                )
            }
            // hide groups with no suggestions
            for (const key of this._filteredSuggestions.keys()) {
                if (this._filteredSuggestions.get(key).length === 0) {
                    this._filteredSuggestions.delete(key)
                }
            }
            this._onDidChangeTreeData.fire()
        }
    }

    public getTreeItem(
        element: SuggestionTreeItem
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (typeof element === 'string') {
            // create a pretty view for a suggestion group
            const treeItem = new vscode.TreeItem(
                element +
                    ' (' +
                    this._filteredSuggestions.get(element).length +
                    ')',
                vscode.TreeItemCollapsibleState.Collapsed
            )
            treeItem.contextValue = 'suggestion_group'
            return treeItem
        }

        // create a pretty view for a suggestion
        const treeItem = new vscode.TreeItem(
            String(element.patternID) + (element.markedForExport ? ' [*]' : '')
        )
        const fileName = element.filePath.split('/').pop()
        // treeItem.resourceUri = vscode.Uri.file(element.filePath)
        treeItem.description = `${fileName}:${element.mappedStartLine}`
        treeItem.tooltip = element.filePath + ':' + element.mappedStartLine
        treeItem.command = {
            command: Commands.showSuggestionDetails,
            title: 'Show Suggestion Details',
            arguments: [element],
        }
        if (element.applied) {
            treeItem.iconPath = new vscode.ThemeIcon('verified-filled')
            treeItem.contextValue = 'suggestion_applied'
        } else {
            treeItem.iconPath = new vscode.ThemeIcon('lightbulb')
            treeItem.contextValue = 'suggestion'
        }

        return treeItem
    }

    public getChildren(
        element?: SuggestionTreeItem
    ): vscode.ProviderResult<SuggestionTreeItem[]> {
        if (this._filteredSuggestions === undefined) {
            return []
        }
        if (element === undefined) {
            const keys = Array.from(this._filteredSuggestions.keys())
            const filteredKeys = keys.filter((key) =>
                this._filteredSuggestions.get(key)
            )
            return filteredKeys
        }
        if (typeof element === 'string') {
            return Array.from(this._filteredSuggestions.get(element))
        }
        // combinedSuggestion has no children
        return undefined
    }
    public getParent?(
        element: SuggestionTreeItem
    ): vscode.ProviderResult<SuggestionTreeItem> {
        if (typeof element === 'string') {
            return undefined
        }
        return element.type
    }
    // resolveTreeItem?
}
