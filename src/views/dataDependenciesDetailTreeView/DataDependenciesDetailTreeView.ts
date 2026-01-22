import * as vscode from 'vscode'
import { Commands } from '../../utils/Commands'
import { DataProvider } from './DataProvider'
import { TreeNode } from './TreeNode'
import { CombinedDataDependency } from '../../resultStore/CombinedDataDependency'
import { DataDependency } from './DataDependency'

export interface DataDependenciesDetailTreeViewCallbacks {
    uiHighlightDataDependency(
        combinedDataDependency: CombinedDataDependency
    ): void
}

export class DataDependenciesDetailTreeView {
    private _dataProvider: DataProvider
    private _treeView: vscode.TreeView<TreeNode>
    private static _instance: DataDependenciesDetailTreeView

    public static create(
        context: vscode.ExtensionContext,
        callbacks: DataDependenciesDetailTreeViewCallbacks
    ): DataDependenciesDetailTreeView {
        if (DataDependenciesDetailTreeView._instance) {
            console.error(
                'DataDependenciesDetailTreeView already created. Only call DataDependenciesDetailTreeView.create once!'
            )
            return DataDependenciesDetailTreeView._instance
        }
        return new DataDependenciesDetailTreeView(context, callbacks)
    }

    private constructor(
        context: vscode.ExtensionContext,
        private callbacks: DataDependenciesDetailTreeViewCallbacks
    ) {
        this._dataProvider = new DataProvider()

        this._treeView = vscode.window.createTreeView(
            'sidebar-data-dependencies-detail-view',
            { treeDataProvider: this._dataProvider }
        )

        context.subscriptions.push(this._treeView)

        vscode.commands.executeCommand(
            'setContext',
            'discopop.dataDependentDetailsAvailable',
            true
        )

        context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.showDataDependency,
                (dataDependency: DataDependency) => {
                    callbacks.uiHighlightDataDependency(
                        dataDependency.dataDependency
                    )
                }
            )
        )
    }

    public update(combinedDataDependencies: CombinedDataDependency[]): void {
        this._dataProvider.update(combinedDataDependencies)
    }

    public clear() {
        this._dataProvider.clear()
    }
}
