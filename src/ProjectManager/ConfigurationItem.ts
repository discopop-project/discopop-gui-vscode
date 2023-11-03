import * as vscode from 'vscode'
import { ProjectManagerTreeItem } from './ProjectManagerTreeItem'
import { Configuration } from './Configuration'
import { ProjectManager } from './ProjectManager'

export class ConfigurationItem<
    T extends string | string[] = string
> extends ProjectManagerTreeItem {
    description?: string
    protected parent: Configuration
    private value: T | undefined

    // e.g. "project path", "path/to/project", "The path to the project"
    constructor(
        parent: Configuration,
        name: string,
        value: T | undefined,
        tooltip: string | undefined
    ) {
        super(name, vscode.TreeItemCollapsibleState.None) // name is renderred prominently (short and descriptive!)
        this.description = this._getDescription(value) // "description" is renderred less prominently (perfect for the value)
        this.value = value
        this.tooltip = tooltip // only rendered when hovering over the item (useful for longer descriptions)

        if (typeof value !== 'string' && value !== undefined) {
            this.tooltip =
                this.tooltip +
                '\n\n' +
                (value as string[]).map((str) => `[${str}]`).join('\n')
        }

        this.parent = parent
        this.contextValue = 'configurationItem' // used to identify the view
        this.iconPath = new vscode.ThemeIcon('symbol-variable')
    }

    getValue(): T {
        return this.value
    }

    setValue(value: T) {
        if (value === undefined) {
            throw new Error('value cannot be undefined') // we are using type information later and undefined has no type
        }
        this.value = value
        this.description = this._getDescription(value)
        ProjectManager.refresh()
    }

    getChildren(): ProjectManagerTreeItem[] {
        // TODO we should show values of string[] settings as children
        return []
    }

    setParent(parent: Configuration) {
        this.parent = parent
    }

    getParent(): Configuration | undefined {
        return this.parent
    }

    private _getDescription(value: T | undefined): string {
        if (value === undefined) {
            return ''
        } else if (typeof value === 'string') {
            return value
        } else {
            return (value as string[]).map((str) => `[${str}]`).join(', ')
        }
    }
}
