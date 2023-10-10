import * as vscode from 'vscode'

export abstract class ProjectManagerTreeItem extends vscode.TreeItem {
    constructor(
        name: string,
        collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(name, collapsibleState)
    }

    abstract getChildren(): ProjectManagerTreeItem[]
    abstract getParent(): ProjectManagerTreeItem | undefined
}
