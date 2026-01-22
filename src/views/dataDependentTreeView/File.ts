import * as vscode from 'vscode'
import { CombinedDataDependency } from '../../resultStore/CombinedDataDependency'
import { TreeNode } from './TreeNode'
import { SimpleTree } from '../../utils/SimpleTree'
import { Dependent } from './Dependent'

export class File implements TreeNode {
    protected _dependents: Map<string, Dependent> = new Map<string, Dependent>()

    public constructor(
        protected _fileName: string,
        protected _tree: SimpleTree<TreeNode>
    ) {}

    public addDependent(dependent: CombinedDataDependency): void {
        if (!this._dependents.get(dependent.id)) {
            this._dependents.set(
                dependent.id,
                new Dependent(dependent, this._tree)
            )
        } else {
            console.error('tried to set same dependent twice')
        }
    }

    public getView(): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            this._fileName,
            vscode.TreeItemCollapsibleState.Collapsed
        )
        treeItem.iconPath = new vscode.ThemeIcon('file')
        treeItem.contextValue = 'data-dependent-tree-file'
        return treeItem
    }

    public getChildren(): TreeNode[] | undefined {
        return [...this._dependents.values()].sort(
            (a, b) => a.dependent.mappedLine - b.dependent.mappedLine
        )
    }

    public refresh() {
        this._tree.refresh()
    }

    public getName(): string {
        return this._fileName
    }
}
