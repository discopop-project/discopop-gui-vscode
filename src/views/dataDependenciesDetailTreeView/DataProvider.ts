import { CombinedDataDependency } from '../../resultStore/CombinedDataDependency'
import { TreeNode } from './TreeNode'
import { SimpleTree } from '../../utils/SimpleTree'
import { DataDependency } from './DataDependency'
import * as vscode from 'vscode'
import { WriteAccess } from './WriteAccess'
import { ReadAccess } from './ReadAccess'

export class DataProvider extends SimpleTree<TreeNode> {
    protected _readAccess: ReadAccess | undefined = undefined

    protected _loadDependents(): void {
        const readAccess: ReadAccess = new ReadAccess(this)
        const writeAccess: WriteAccess = new WriteAccess(this)

        for (const dataDependency of this._combinedDataDependencies) {
            if (dataDependency.access === 'INIT') {
                this.roots.push(new DataDependency(dataDependency, this))
            } else if (dataDependency.access === 'RAW') {
                readAccess.addDataDependency(dataDependency)
            } else {
                writeAccess.addDataDependency(dataDependency)
            }
        }

        this.roots.push(readAccess)
        this.roots.push(writeAccess)
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
