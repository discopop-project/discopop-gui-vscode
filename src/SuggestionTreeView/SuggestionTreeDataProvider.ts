import * as vscode from 'vscode'

export class SuggestionTreeItem extends vscode.TreeItem {
    constructor(
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState = vscode
            .TreeItemCollapsibleState.None
    ) {
        super(label, collapsibleState)
    }
}

export interface Patterns {
    do_all: any[]
    geometric_decomposition: any[]
    pipeline: any[]
    reduction: any[]
    simple_gpu: any[]
}

export class SuggestionTreeDataProvider
    implements vscode.TreeDataProvider<SuggestionTreeItem>
{
    private static instance: SuggestionTreeDataProvider | undefined

    private parsedPatterns: Patterns

    private constructor(parsedPatterns: Patterns) {
        this.parsedPatterns = parsedPatterns
    }

    static getInstance(patterns: Patterns): SuggestionTreeDataProvider {
        if (!SuggestionTreeDataProvider.instance) {
            SuggestionTreeDataProvider.instance =
                new SuggestionTreeDataProvider(patterns)
            vscode.window.registerTreeDataProvider(
                'sidebar-suggestions-view',
                SuggestionTreeDataProvider.instance
            )
        }
        SuggestionTreeDataProvider.instance.replacePatterns(patterns)
        return SuggestionTreeDataProvider.instance
    }

    replacePatterns(patterns: Patterns) {
        this.parsedPatterns = patterns
        // TODO refresh the tree view
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
            return this.parsedPatterns[element.label as keyof Patterns].map(
                (pattern) => {
                    return new SuggestionTreeItem(JSON.stringify(pattern))
                }
            )
        }
        throw new Error('Method not implemented.')
    }
    // onDidChangeTreeData?: vscode.Event<void | SuggestionTreeItem | SuggestionTreeItem[]>;
    // getParent?(element: PatternTreeItem): vscode.ProviderResult<PatternTreeItem> {
    //     throw new Error('Method not implemented.');
    // }
    // resolveTreeItem?(item: vscode.TreeItem, element: PatternTreeItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
    //     throw new Error('Method not implemented.');
    // }
}
