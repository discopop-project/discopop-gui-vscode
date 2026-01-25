import * as vscode from 'vscode'
import { CombinedDataDependency } from '../../resultStore/CombinedDataDependency'
import { TreeNode } from './TreeNode'
import { SimpleTree } from '../../utils/SimpleTree'
import { Property } from './Property'
import { Commands } from '../../utils/Commands'

export class DataDependency implements TreeNode {
    protected _properties: Property[] = []

    public constructor(
        protected _dataDependency: CombinedDataDependency,
        protected _tree: SimpleTree<TreeNode>
    ) {
        for (const property of Object.keys(_dataDependency)) {
            this._properties.push(
                new Property(property, String(_dataDependency[property]), _tree)
            )
        }

        this._properties.sort((a, b) => a.name.localeCompare(b.name))
    }

    public getView(): vscode.TreeItem {
        const fileName = this._dataDependency.filePath.split('/').at(-1)
        let treeItem: vscode.TreeItem

        if (this._dataDependency.access === 'INIT') {
            treeItem = new vscode.TreeItem(
                `${this._dataDependency.dependentName}`,
                vscode.TreeItemCollapsibleState.Collapsed
            )
        } else {
            treeItem = new vscode.TreeItem(
                `File : ${fileName} , Ln : ${this._dataDependency.mappedLine} , Access type : ${this._dataDependency.access}`,
                vscode.TreeItemCollapsibleState.Collapsed
            )
        }

        treeItem.iconPath = new vscode.ThemeIcon('symbol-class')
        treeItem.contextValue = 'data-dependency-detail-tree-data-dependency'

        treeItem.command = {
            command: Commands.showDataDependency,
            title: 'Show dependency',
            arguments: [this],
        }

        return treeItem
    }

    public get dataDependency(): CombinedDataDependency {
        return this._dataDependency
    }

    public getChildren(): TreeNode[] | undefined {
        return this._properties
    }

    public refresh() {
        this._tree.refresh()
    }

    public getFileName(): string {
        return this._dataDependency.filePath.split('/').at(-1)
    }

    public getLineNumber(): string {
        return String(this._dataDependency.mappedLine)
    }
}
