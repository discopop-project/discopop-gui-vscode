import { RootHookObject } from 'mocha';
import * as path from 'path';
import * as vscode from 'vscode';
import { TreeItemLabel, Uri, Command } from 'vscode';
import { ItemType } from '../ItemType';
import parseMappingToTree from '../misc/FileMappingParser';
import { StateManager } from '../misc/StateManager';
import { TreeUtils } from '../TreeUtils';
import { Config } from "../Config";

interface NodeItem {
  id?: string;
  fsPath?: string;
  isFile: boolean;
  resourceUri?: Uri;
  line?: number;
  column?: number;
}

export class TreeItem extends vscode.TreeItem implements NodeItem {
  children: TreeItem[] | undefined;
  id: string;
  isFile: boolean;
  path?: string;
  name?: string;
  active: boolean;

  constructor(label: string, children?: TreeItem[]) {
    super(
      label
    )
    this.children = children;
  }
}

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  data: TreeItem;

  private _context: vscode.ExtensionContext;
  private _workspaceRoot: string | undefined;

  constructor(_context: vscode.ExtensionContext, fileMapping: string) {
    this._context = _context;
    this._workspaceRoot = (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;
    this.data = parseMappingToTree(fileMapping);
  }

  getTreeItem(element: TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    // Implement this to return the UI representation (TreeItem) of the element that 
    // gets displayed in the view.

    // add jump to file command for items which represent a file
    if (element.contextValue === ItemType.File) {
      element.command = TreeUtils.getJumpToFileCommand(TreeUtils.getPathById(this.data.children, element.id, Config.getWorkspacePath()), 0);
    }

    return element;
  }

  getChildren(element?: TreeItem | undefined): vscode.ProviderResult<TreeItem[]> {
    // Implement this to return the children for the given element or root (if no element is passed).

    if (!this._workspaceRoot) {
      vscode.window.showInformationMessage('No files to inspect in empty workspace');
      return [];
    }
    if (element === undefined) {
      // display full results
      return [this.data];
    }
    return element.children;
  }

  public filterActiveFiles(node, root, arr) {
    if (node.id && node.active) {
      arr.push({
        id: node.id,
        path: TreeUtils.getPathById(this.data.children, node.id, root),
        name: node.name
      })
    }
    if (node.children) {
      node.children.map((children) => this.filterActiveFiles(children, root, arr))
    }
    return
  }

  public getActiveFiles() {
    let root = vscode.workspace.workspaceFolders[0].uri.fsPath
    let res = []
    this.data.children.map((node) => this.filterActiveFiles(node, root, res))

    return res
  }

  public saveTreeToStateAndRefresh() {
    const stateManager = new StateManager(this._context);

    stateManager.save('tree', JSON.stringify(this.data));
    this._onDidChangeTreeData.fire();
  }

  public loadTreeFromState(): boolean {
    const stateManager = new StateManager(this._context);

    const loadedTree = JSON.parse(stateManager.read('tree'));

    if (loadedTree) {
      this.data = loadedTree;
      this._onDidChangeTreeData.fire();
      return true
    }

    return false
  }

  public toggleEntry(item: TreeItem) {
    const existingItem = TreeUtils.getChildById(this.data, item.id);
    if (!existingItem) {
      vscode.window.showErrorMessage('Could not toggle entry. Not found');
    }

    existingItem.active = !existingItem.active;

    existingItem.iconPath = existingItem.active ?
      path.join(__filename, '..', '..', '..', 'media', 'tree_icon.svg')
      :
      undefined;

    this.saveTreeToStateAndRefresh();
  }

  public toggleFolder(root: TreeItem) {
    TreeUtils.toggleAllChilds(root, !root.active);

    this.saveTreeToStateAndRefresh();
  }

  setFileMapping(fileMapping: string) {
    this.data = parseMappingToTree(fileMapping);
    this.saveTreeToStateAndRefresh();
  }

  public reloadFileMappingFromState(): boolean {
    if (!this._context) {
      return false
    }

    const stateManager = new StateManager(this._context);

    const fileMappingString = stateManager.read("fileMapping");

    if (!fileMappingString || fileMappingString === "") {
      return false
    }

    this.setFileMapping(fileMappingString)
  }
}
