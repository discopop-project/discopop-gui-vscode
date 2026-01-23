import * as vscode from 'vscode'
import { CombinedDataDependency } from '../../resultStore/CombinedDataDependency'
import { TreeNode } from './TreeNode'
import { SimpleTree } from '../../utils/SimpleTree'
import { DataDependency } from './DataDependency'

export class ReadAccess implements TreeNode {
    protected _dataDependencies: DataDependency[] = []

    public constructor(protected _tree: SimpleTree<TreeNode>) {}

    public addDataDependency(dataDependency: CombinedDataDependency): void {
        this._dataDependencies.push(
            new DataDependency(dataDependency, this._tree)
        )

        this._dataDependencies.sort((a, b) => {
            if (
                !(a instanceof DataDependency) ||
                !(b instanceof DataDependency)
            ) {
                console.error(
                    'other than type of DataDependency added to ReadAccess, this should never happen'
                )
                return 0
            }

            const fileCompare = a.getFileName().localeCompare(b.getFileName())
            if (fileCompare !== 0) {
                return fileCompare
            }

            return Number(a.getLineNumber()) - Number(b.getLineNumber())
        })
    }

    public getView(): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            'Read access',
            vscode.TreeItemCollapsibleState.Collapsed
        )
        treeItem.iconPath = new vscode.ThemeIcon('folder')
        treeItem.contextValue = 'data-dependency-detail-tree-read-access'

        return treeItem
    }

    public getChildren(): TreeNode[] | undefined {
        return this._dataDependencies
    }

    public refresh(): void {
        this._tree.refresh()
    }
}
