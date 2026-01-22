import * as vscode from 'vscode'
import { Commands } from '../../utils/Commands'
import { Dependent } from './Dependent'
import { DataProvider } from './DataProvider'
import { TreeNode } from './TreeNode'
import { CombinedDataDependency } from '../../resultStore/CombinedDataDependency'

export interface DataDependentTreeViewCallbacks {
    uiShowDataDependenciesOfDependent(
        combinedDataDependencies: CombinedDataDependency[]
    ): void
    uiClearDataDependenciesOfDependent(): void
}

export class DataDependentTreeView {
    private _dataProvider: DataProvider
    private _treeView: vscode.TreeView<TreeNode>
    private static _instance: DataDependentTreeView

    public static create(
        context: vscode.ExtensionContext,
        callbacks: DataDependentTreeViewCallbacks
    ): DataDependentTreeView {
        if (DataDependentTreeView._instance) {
            console.error(
                'DataDependentTreeView already created. Only call DataDependentTreeView.create once!'
            )
            return DataDependentTreeView._instance
        }
        return new DataDependentTreeView(context, callbacks)
    }

    private constructor(
        context: vscode.ExtensionContext,
        private _callbacks: DataDependentTreeViewCallbacks
    ) {
        this._dataProvider = new DataProvider()

        this._treeView = vscode.window.createTreeView(
            'sidebar-data-dependents-view',
            { treeDataProvider: this._dataProvider }
        )

        context.subscriptions.push(this._treeView)

        vscode.commands.executeCommand(
            'setContext',
            'discopop.dataDependentsAvailable',
            false
        )

        context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.showDataDependentDetails,
                (dependent: Dependent) => {
                    _callbacks.uiShowDataDependenciesOfDependent(
                        this._dataProvider.getCombinedDataDependencies(
                            dependent.dependent.id
                        )
                    )
                }
            )
        )
    }

    public update(
        combinedDataDependencies: Map<string, CombinedDataDependency[]>,
        projectPath: string
    ): void {
        this._callbacks.uiClearDataDependenciesOfDependent()
        this._dataProvider.update(combinedDataDependencies, projectPath)
    }

    public clear() {
        this._dataProvider.clear()
        this._callbacks.uiClearDataDependenciesOfDependent()
    }
}
