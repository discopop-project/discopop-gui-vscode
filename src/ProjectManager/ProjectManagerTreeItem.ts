import * as vscode from 'vscode'
import { SimpleTreeNode } from '../Utils/SimpleTree'

export abstract class ProjectManagerTreeItem
    extends vscode.TreeItem
    implements SimpleTreeNode<ProjectManagerTreeItem>
{
    constructor(
        name: string,
        collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(name, collapsibleState)
        this.onDidChange((_) => this.getParent()?.refresh())
    }

    private _onDidChange: vscode.EventEmitter<ProjectManagerTreeItem> =
        new vscode.EventEmitter<ProjectManagerTreeItem>()
    public readonly onDidChange: vscode.Event<ProjectManagerTreeItem> =
        this._onDidChange.event
    public refresh(): void {
        this._onDidChange.fire(this)
    }

    abstract getView(): vscode.TreeItem
    abstract getChildren(): ProjectManagerTreeItem[] | undefined
    abstract getParent(): ProjectManagerTreeItem | undefined
}
