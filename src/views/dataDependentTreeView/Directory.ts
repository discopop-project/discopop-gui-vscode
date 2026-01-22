import * as vscode from 'vscode'
import { CombinedDataDependency } from '../../resultStore/CombinedDataDependency'
import { TreeNode } from './TreeNode'
import { SimpleTree } from '../../utils/SimpleTree'
import { File } from './File'

export class Directory implements TreeNode {
    protected _directoriesOrFiles: Map<string, TreeNode> = new Map<
        string,
        TreeNode
    >()

    public constructor(
        protected _folderName: string,
        protected _tree: SimpleTree<TreeNode>
    ) {}

    public addDependent(
        nextInHierarchy: string[],
        dependent: CombinedDataDependency
    ): void {
        let directoryOrFile = this._directoriesOrFiles.get(nextInHierarchy[0])

        if (!directoryOrFile) {
            if (nextInHierarchy.length <= 1) {
                this._directoriesOrFiles.set(
                    nextInHierarchy[0],
                    new File(nextInHierarchy[0], this._tree)
                )
            } else {
                this._directoriesOrFiles.set(
                    nextInHierarchy[0],
                    new Directory(nextInHierarchy[0], this._tree)
                )
            }

            directoryOrFile = this._directoriesOrFiles.get(nextInHierarchy[0])
        }

        if (directoryOrFile instanceof File) {
            directoryOrFile.addDependent(dependent)
        } else if (directoryOrFile instanceof Directory) {
            directoryOrFile.addDependent(nextInHierarchy.slice(1), dependent)
        }
    }

    public getView(): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            this._folderName,
            vscode.TreeItemCollapsibleState.Collapsed
        )
        treeItem.iconPath = new vscode.ThemeIcon('folder')
        treeItem.contextValue = 'data-dependent-tree-directory'
        return treeItem
    }

    public getChildren(): TreeNode[] | undefined {
        return [...this._directoriesOrFiles.values()].sort((a, b) =>
            a.getName().localeCompare(b.getName())
        )
    }

    public refresh() {
        this._tree.refresh()
    }

    public getName(): string {
        return this._folderName
    }
}
