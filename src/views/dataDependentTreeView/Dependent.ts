import * as vscode from 'vscode'
import { CombinedDataDependency } from '../../resultStore/CombinedDataDependency'
import { TreeNode } from './TreeNode'
import { SimpleTree } from '../../utils/SimpleTree'
import { Commands } from '../../utils/Commands'

export class Dependent implements TreeNode {
    public constructor(
        protected _dependent: CombinedDataDependency,
        protected _tree: SimpleTree<TreeNode>
    ) {}

    public getView(): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            `${this._dependent.dependentName} : Ln ${this._dependent.mappedLine}`,
            vscode.TreeItemCollapsibleState.None
        )

        treeItem.iconPath = new vscode.ThemeIcon('symbol-field')
        treeItem.contextValue = 'data-dependency-tree-dependent'

        treeItem.command = {
            command: Commands.showDataDependentDetails,
            title: 'Show dependencies',
            arguments: [this],
        }

        return treeItem
    }

    public getChildren(): TreeNode[] | undefined {
        return undefined
    }

    public get dependent(): CombinedDataDependency {
        return this._dependent
    }

    public refresh() {
        this._tree.refresh()
    }

    public getName(): string {
        return this._dependent.dependentName
    }
}
