import * as vscode from 'vscode'
import { CombinedDataDependency } from '../../resultStore/CombinedDataDependency'
import { TreeNode } from './TreeNode'
import { SimpleTree } from '../../utils/SimpleTree'
import { Commands } from '../../utils/Commands'

export class Property implements TreeNode {
    public constructor(
        protected _name: string,
        protected _value: string,
        protected _tree: SimpleTree<TreeNode>
    ) {}

    public getView(): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            `${this._name} : ${this._value}`,
            vscode.TreeItemCollapsibleState.None
        )

        treeItem.iconPath = new vscode.ThemeIcon('symbol-field')
        treeItem.contextValue = 'data-dependency-detail-tree-property'
        return treeItem
    }

    public getChildren(): TreeNode[] | undefined {
        return undefined
    }

    public refresh() {
        this._tree.refresh()
    }

    public get name(): string {
        return this._name
    }
}
