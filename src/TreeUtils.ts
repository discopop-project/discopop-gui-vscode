import * as path from 'path'
import * as vscode from 'vscode'
import { Command } from 'vscode'
import { Config } from './Config'
import { TreeItem } from './Provider/TreeDataProvider'

export class TreeUtils {
    public static getChildById(root: TreeItem, id: string) {
        if (root.id === id) {
            return root
        }

        if (!root.children) {
            return null
        }

        for (let i = 0; i < root.children.length; i++) {
            const found = this.getChildById(root.children[i], id)
            if (found) {
                return found
            }
        }
    }

    public static getPathById(tree: TreeItem[], id: string, path: string) {
        const idx = tree.findIndex((node) => {
            return node.id === id
        })
        if (idx < 0) {
            for (const node of tree) {
                if (node.children?.length) {
                    if (node.label) {
                        path += '/' + node.label
                    }

                    return this.getPathById(node.children, id, path)
                }
            }
        } else {
            // if index found this means that the file has been found and full path can be returned
            path += '/' + tree[idx].label
            return path
        }
    }

    public static toggleAllChilds(root: TreeItem, active: boolean) {
        root.active = active

        root.children.map((child) => this.toggleAllChilds(child, active))
    }

    public static removeAbsoluteSubpath(path: string) {
        // /a/b/c/workingDirectory/d/e/f -> d/e/f
        const workspacePath = Config.getWorkspacePath()
        return path.replace(workspacePath + '/', '')
    }

    public static getJumpToFileCommand(fsPath: string, line: number): Command {
        let comm = {
            title: 'Jump to file',
            command: 'vscode.open',
            arguments: [
                vscode.Uri.file(fsPath),
                {
                    selection: new vscode.Selection(
                        new vscode.Position(line, 0),
                        new vscode.Position(line, 0)
                    ),
                },
            ],
        }
        return comm
    }
}
