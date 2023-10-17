import * as vscode from 'vscode'
import { ProjectManagerTreeItem } from './ProjectManagerTreeItem'
import { Configuration } from './Configuration'

export class ConfigurationItem extends ProjectManagerTreeItem {
    description?: string
    protected parent: Configuration

    // e.g. "project path", "path/to/project", "The path to the project"
    constructor(
        parent: Configuration,
        name: string,
        value: string | undefined,
        tooltip: string | undefined
    ) {
        super(name, vscode.TreeItemCollapsibleState.None) // name is renderred prominently (short and descriptive!)
        this.description = value // "description" is renderred less prominently (perfect for the value)
        this.tooltip = tooltip // only rendered when hovering over the item (useful for longer descriptions)

        this.parent = parent
        this.contextValue = 'configurationItem' // used to identify the view
        this.iconPath = new vscode.ThemeIcon('symbol-variable')
    }

    getValue(): string {
        return this.description
    }

    setValue(value: string) {
        this.description = value
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
