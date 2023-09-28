import * as vscode from 'vscode'
import { ProjectManagerTreeItem } from "./ProjectManagerTreeItem"
import { Configuration } from './Configuration'

export class ConfigurationItem extends ProjectManagerTreeItem {
    private key: string // key
    description: string // value
    protected parent: Configuration | undefined

    constructor(key: string, value: string, description: string) {
        super(key, vscode.TreeItemCollapsibleState.None)
        this.key = key
        this.description = value
        this.tooltip = description
        this.contextValue = "configurationItem"
        this.iconPath = new vscode.ThemeIcon("gear")
    }

    getKey(): string {
        return this.key
    }

    getValue(): string {
        return this.description
    }

    getChildren(): ProjectManagerTreeItem[] {
        return []
    }

    setParent(parent: Configuration) {
        this.parent = parent
    }

    getParent(): Configuration | undefined {
        return this.parent
    }
}