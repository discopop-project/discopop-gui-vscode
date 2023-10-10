import path = require('path')
import * as vscode from 'vscode'
import { TreeItemCollapsibleState } from 'vscode'
import { Config } from '../Config'
import { TreeItem } from '../Provider/TreeDataProvider'
import { ItemType } from '../ItemType'
import { TreeUtils } from '../TreeUtils'
import { StateManager } from './StateManager'

function createNode(tree: TreeItem[], filePath: string[], id: string) {
    let label = filePath.shift()
    const idx = tree.findIndex((node) => {
        return node.label === label
    })

    if (idx < 0) {
        // todo handle root workspace. Meaning put all root elements in one node
        const isFile = filePath.length === 0
        tree.push({
            active: false,
            label: label,
            children: [],
            // 0 no children
            // 1 collapsed
            // 2 expanded
            // give 0 on init and if we have results for a file set to either 1 or 2
            collapsibleState: isFile
                ? TreeItemCollapsibleState.None
                : TreeItemCollapsibleState.Expanded,
            id: isFile ? id : undefined,
            contextValue: isFile ? ItemType.File : ItemType.Folder,
            name: isFile ? getFileName(label) : undefined,
        })
        if (filePath.length !== 0) {
            createNode(tree[tree.length - 1].children, filePath, id)
        }
    } else {
        createNode(tree[idx].children, filePath, id)
    }
}

function getFileName(label: string) {
    return path.parse(label).name
}

export default function parseMappingToTree(
    fileMapping: string,
    context: any
): TreeItem {
    const lines = fileMapping.split('\n').filter((line) => line !== '')

    let tree: TreeItem[] = []

    lines.map((line) => {
        const lineArr = line.split('\t')
        let [id, path] = lineArr

        // CLEAR ALL PATH STATES TO EMPTY CODELENSES
        const stateManager = new StateManager(context)
        stateManager.save(path, JSON.stringify([]))

        path = TreeUtils.removeAbsoluteSubpath(path)

        const split = path.split('/')

        createNode(tree, split, id)
    })

    let root = new TreeItem(Config.getRootLabel(), tree)
    root.collapsibleState = TreeItemCollapsibleState.Expanded
    root.contextValue = ItemType.Folder

    return root
}
