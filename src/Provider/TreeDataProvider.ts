import * as vscode from 'vscode'
import { ItemType } from '../ItemType'
import parseMappingToTree from '../misc/FileMappingParser'
import { StateManager } from '../misc/StateManager'
import { TreeUtils } from '../TreeUtils'
import { Config } from '../Config'
import Utils from '../Utils'
import { ResultType } from '../ResultType'

export class TreeItem extends vscode.TreeItem {
    children: TreeItem[] | undefined
    id?: string
    path?: string
    name?: string
    active?: boolean

    resultIdentifier?: string
    startLine?: number
    resultType?: ResultType

    constructor(label: string, children?: TreeItem[]) {
        super(label)
        this.children = children
    }
}

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<
        TreeItem | undefined | null | void
    > = new vscode.EventEmitter<TreeItem | undefined | null | void>()
    readonly onDidChangeTreeData: vscode.Event<
        TreeItem | undefined | null | void
    > = this._onDidChangeTreeData.event

    public data: TreeItem

    private _context: vscode.ExtensionContext
    private _workspaceRoot: string | undefined

    constructor(_context: vscode.ExtensionContext, fileMapping: string) {
        this._context = _context
        this._workspaceRoot =
            vscode.workspace.workspaceFolders &&
            vscode.workspace.workspaceFolders.length > 0
                ? vscode.workspace.workspaceFolders[0].uri.fsPath
                : undefined
        this.data = parseMappingToTree(fileMapping, this._context)
    }

    getTreeItem(
        element: TreeItem
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        // Implement this to return the UI representation (TreeItem) of the element that
        // gets displayed in the view.

        // add jump to file command for items which represent a file
        if (element.contextValue === ItemType.File) {
            element.command = TreeUtils.getJumpToFileCommand(
                TreeUtils.getPathById(
                    this.data.children,
                    element.id,
                    Config.getWorkspacePath()
                ),
                0
            )
        }

        element.iconPath = Utils.getIcon(element, this._context)

        return element
    }

    getChildren(
        element?: TreeItem | undefined
    ): vscode.ProviderResult<TreeItem[]> {
        // Implement this to return the children for the given element or root (if no element is passed).

        if (!this._workspaceRoot) {
            vscode.window.showInformationMessage(
                'No files to inspect in empty workspace'
            )
            return []
        }
        if (element === undefined) {
            // display full results
            return [this.data]
        }
        return element.children
    }

    public filterActiveFiles(node, root, arr) {
        if (node.id && node.active) {
            arr.push({
                id: node.id,
                path: TreeUtils.getPathById(this.data.children, node.id, root),
                name: node.name,
            })
        }
        if (node.children) {
            node.children.map((children) =>
                this.filterActiveFiles(children, root, arr)
            )
        }
        return
    }

    public getActiveFiles() {
        let root = vscode.workspace.workspaceFolders[0].uri.fsPath
        let res = []
        this.data.children.map((node) =>
            this.filterActiveFiles(node, root, res)
        )

        return res
    }

    public filterExecutableFiles(node, root, arr) {
        if (node.id) {
            arr.push({
                id: node.id,
                path: TreeUtils.getPathById(this.data.children, node.id, root),
                name: node.name,
            })
        }
        if (node.children) {
            node.children.map((children) =>
                this.filterExecutableFiles(children, root, arr)
            )
        }
        return
    }

    public getExecutableFiles() {
        let root = vscode.workspace.workspaceFolders[0].uri.fsPath
        let res = []
        this.data.children.map((node) =>
            this.filterExecutableFiles(node, root, res)
        )

        return res
    }

    public forceTreeState(treeRoot) {
        this.data = treeRoot
        const stateManager = new StateManager(this._context)
        stateManager.save('tree', JSON.stringify(treeRoot))

        this._onDidChangeTreeData.fire()
    }

    public getCurrentTree() {
        this.loadTreeFromState()
        return this.data
    }

    public saveTreeToStateAndRefresh() {
        const stateManager = new StateManager(this._context)

        stateManager.save('tree', JSON.stringify(this.data))
        this._onDidChangeTreeData.fire()
    }

    public loadTreeFromState(): boolean {
        const stateManager = new StateManager(this._context)

        const retrieved = stateManager.read('tree')

        if (retrieved && retrieved.length) {
            const loadedTree = JSON.parse(retrieved)

            if (loadedTree) {
                this.data = loadedTree
                this._onDidChangeTreeData.fire()
                return true
            }
        }

        return false
    }

    public toggleEntry(item: TreeItem) {
        const existingItem = TreeUtils.getChildById(this.data, item.id)
        if (!existingItem) {
            vscode.window.showErrorMessage('Could not toggle entry. Not found')
        }

        existingItem.active = !existingItem.active

        this.saveTreeToStateAndRefresh()
    }

    public toggleFolder(root: TreeItem) {
        TreeUtils.toggleAllChilds(root, !root.active)

        this.saveTreeToStateAndRefresh()
    }

    setFileMapping(fileMapping: string) {
        this.data = parseMappingToTree(fileMapping, this._context)
        this.saveTreeToStateAndRefresh()
    }

    public reloadFileMappingFromState(): boolean {
        if (!this._context) {
            return false
        }

        const stateManager = new StateManager(this._context)

        const fileMappingString = stateManager.read('fileMapping')

        if (!fileMappingString || fileMappingString === '') {
            return false
        }

        this.setFileMapping(fileMappingString)
    }

    public moveOtherRecommendations(
        recommendationId,
        fileId,
        startLine,
        resultType
    ) {
        const item = TreeUtils.getChildById(this.data, fileId.toString())

        item.children = item.children.map((result) => {
            if (
                result.resultIdentifier !== recommendationId &&
                result.startLine > startLine
            ) {
                result.startLine += 1
                result.label = Utils.getResultLabel(
                    resultType,
                    result.startLine
                )
                return result
            }
            return result
        })

        this.saveTreeToStateAndRefresh()
    }
}
