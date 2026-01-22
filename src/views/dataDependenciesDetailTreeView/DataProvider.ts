import { CombinedDataDependency } from '../../resultStore/CombinedDataDependency'
import { TreeNode } from './TreeNode'
import { SimpleTree } from '../../utils/SimpleTree'
import { DataDependency } from './DataDependency'
import * as vscode from 'vscode'

export class DataProvider extends SimpleTree<TreeNode> {
    protected _loadDependents(): void {
        for (const dataDependency of this._combinedDataDependencies) {
            this.roots.push(new DataDependency(dataDependency, this))
        }

        this.roots.sort((a, b) => {
            if (
                !(a instanceof DataDependency) ||
                !(b instanceof DataDependency)
            ) {
                console.error(
                    'other than type of DataDependency added to DataProvider, this should never happen'
                )
                return 0
            }

            if (a.checkINIT() !== b.checkINIT()) {
                return a.checkINIT() ? -1 : 1
            }

            const fileCompare = a.getFileName().localeCompare(b.getFileName())
            if (fileCompare !== 0) {
                return fileCompare
            }

            return Number(a.getLineNumber()) - Number(b.getLineNumber())
        })
    }

    public constructor() {
        super([])
    }

    protected _combinedDataDependencies: CombinedDataDependency[] | undefined =
        undefined
    public update(combinedDataDependencies: CombinedDataDependency[]): void {
        this.roots = []
        this._combinedDataDependencies = combinedDataDependencies

        if (this._combinedDataDependencies !== undefined) {
            this._loadDependents()

            vscode.commands.executeCommand(
                'setContext',
                'discopop.dataDependentDetailsAvailable',
                true
            )
        } else {
            vscode.commands.executeCommand(
                'setContext',
                'discopop.dataDependentDetailsAvailable',
                false
            )
        }

        this.refresh()
    }

    public clear(): void {
        this._combinedDataDependencies = undefined
        this.roots = []
        this.refresh()
    }
}
