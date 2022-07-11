import { RootHookObject } from 'mocha';
import * as vscode from 'vscode';
import { TreeItemLabel, Uri, Command } from 'vscode';
import parseMappingToTree, { getPathById, removeAbsoluteSubpath } from '../misc/FileMappingParser';
import { StateManager } from '../misc/StateManager';

export enum ItemType {
  File = 'file',
  Folder = 'folder'
}

// custom node type for internal usage
interface NodeItem {
  id?: string;
  fsPath?: string;
  isFile: boolean;
  resourceUri?: Uri;
  line?: number;
  column?: number;
}

export class TreeItem extends vscode.TreeItem implements NodeItem {
  children: TreeItem[]|undefined;
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

  getTreeItem(element: TreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
    // Implement this to return the UI representation (TreeItem) of the element that 
    // gets displayed in the view.
    return element;
  }

  getChildren(element?: TreeItem|undefined): vscode.ProviderResult<TreeItem[]> {
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
        path: getPathById(this.data.children, node.id, root),
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

  public toggleEntry(item: TreeItem) {
    const existingItem = this.getChildById(this.data, item.id);
    if (!existingItem) {
      vscode.window.showErrorMessage('Could not toggle entry. Not found');
    }

    existingItem.active = !existingItem.active;
  }

  public getChildById(root: TreeItem, id: string) {

    if(root.id === id) {
      return root;
    }

    for(let i = 0; i < root.children.length; i++) {
      const found = this.getChildById(root.children[i], id)
      if(found) {
        return found
      }
    }
  }

  public setFileMapping(fileMapping: string) {
    this.data = parseMappingToTree(fileMapping)
    this._onDidChangeTreeData.fire();
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

















const getCommand = (fsPath: string, line: number): Command => {
  let comm = {
    title: "Jump to recommendation",
    command: "vscode.open",
    arguments: [
      vscode.Uri.file(fsPath),
      {selection: new vscode.Selection(new vscode.Position(line, 0), new vscode.Position(line, 0))}
    ]
  };
  return comm;
}