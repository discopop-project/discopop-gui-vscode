import * as vscode from 'vscode'
import { Commands } from './Commands'
import { FileMapping } from './misc/DiscoPoPParser'

export class SuggestionTreeItem extends vscode.TreeItem {
    constructor(
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState = vscode
            .TreeItemCollapsibleState.None
    ) {
        super(label, collapsibleState)
    }
}

export interface ParsedSuggestion {
    node_id: string
    start_line: string
    end_line: string

    // additional fields are currently not used and can only be viewed in the detail view
}

export interface PatternsJsonFile {
    do_all: ParsedSuggestion[]
    geometric_decomposition: ParsedSuggestion[]
    pipeline: ParsedSuggestion[]
    reduction: ParsedSuggestion[]
    simple_gpu: ParsedSuggestion[]
}

export class SuggestionTreeDataProvider
    implements vscode.TreeDataProvider<SuggestionTreeItem>
{
    private static instance: SuggestionTreeDataProvider | undefined

    private parsedPatterns: PatternsJsonFile
    private fileMapping: FileMapping
    private disposable: vscode.Disposable

    private constructor(
        parsedPatterns: PatternsJsonFile,
        fileMapping: FileMapping
    ) {
        this.replacePatterns(parsedPatterns, fileMapping)
        this.show()
    }

    static getInstance(
        fileMapping: FileMapping,
        patterns: PatternsJsonFile
    ): SuggestionTreeDataProvider {
        if (!SuggestionTreeDataProvider.instance) {
            SuggestionTreeDataProvider.instance =
                new SuggestionTreeDataProvider(patterns, fileMapping)
        } else {
            SuggestionTreeDataProvider.instance.replacePatterns(
                patterns,
                fileMapping
            )
        }
        return SuggestionTreeDataProvider.instance
    }

    private replacePatterns(
        patterns: PatternsJsonFile,
        fileMapping: FileMapping
    ) {
        this.parsedPatterns = patterns
        this.fileMapping = fileMapping
        this._onDidChangeTreeData.fire()
    }

    public hide() {
        this.disposable.dispose()
    }

    public show() {
        this.disposable = vscode.window.registerTreeDataProvider(
            'sidebar-suggestions-view',
            this
        )
    }

    // TreeDataProvider implementation:
    getTreeItem(
        element: SuggestionTreeItem
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
    getChildren(
        element?: SuggestionTreeItem
    ): vscode.ProviderResult<SuggestionTreeItem[]> {
        if (!element) {
            return [
                'do_all',
                'geometric_decomposition',
                'pipeline',
                'reduction',
                'simple_gpu',
            ].map((patternName) => {
                return new SuggestionTreeItem(
                    patternName,
                    vscode.TreeItemCollapsibleState.Collapsed
                )
            })
        } else {
            return this.parsedPatterns[
                element.label as keyof PatternsJsonFile
            ].map((pattern) => {
                const fileName = this.fileMapping.getFilePath(
                    parseInt(pattern.start_line.split(':')[0])
                )
                const lineNr = parseInt(pattern.start_line.split(':')[1])
                const item = new SuggestionTreeItem(pattern.node_id)
                item.description = fileName
                item.iconPath = new vscode.ThemeIcon('lightbulb')
                item.contextValue = 'suggestion'
                item.command = {
                    command: Commands.showSuggestionDetails,
                    title: 'Show Suggestion Details',
                    arguments: [pattern],
                }
                return item
            })
        }
    }

    private _onDidChangeTreeData: vscode.EventEmitter<
        SuggestionTreeItem | undefined | null | void
    > = new vscode.EventEmitter<SuggestionTreeItem | undefined | null | void>()

    readonly onDidChangeTreeData: vscode.Event<
        SuggestionTreeItem | undefined | null | void
    > = this._onDidChangeTreeData.event

    // getParent?(element: PatternTreeItem): vscode.ProviderResult<PatternTreeItem> {
    //     throw new Error('Method not implemented.');
    // }
    // resolveTreeItem?(item: vscode.TreeItem, element: PatternTreeItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
    //     throw new Error('Method not implemented.');
    // }
}
