import * as vscode from 'vscode'

// The following interface and class simplify the creation of TreeViews

/** T is the type of the children */
export interface SimpleTreeNode<T extends SimpleTreeNode<T> | undefined> {
    /** Returns the view for this tree node */
    getView(): vscode.TreeItem

    /** Returns the children of the node.
     * @returns array of children nodes (empty array if there are none) or undefined if node is a leaf node.
     */
    getChildren(): T[] | undefined
}

export abstract class SimpleTree<T extends SimpleTreeNode<T>>
    implements vscode.TreeDataProvider<T>
{
    public constructor(protected roots: T[]) {}

    protected _onDidChangeTreeData: vscode.EventEmitter<
        T | undefined | null | void
    > = new vscode.EventEmitter<T | undefined | null | void>()
    readonly onDidChangeTreeData: vscode.Event<void | T | T[]> =
        this._onDidChangeTreeData.event

    public refresh(): void {
        this._onDidChangeTreeData.fire()
    }

    public getTreeItem(
        element: T
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element.getView()
    }

    public getChildren(element?: T): T[] {
        if (!element) {
            return this.roots
        } else {
            return element.getChildren()
        }
    }
}
