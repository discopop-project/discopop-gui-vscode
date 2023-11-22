import * as vscode from 'vscode'
import { CMakeConfiguration } from './Configuration'
import { ProjectManagerTreeItem } from './ProjectManagerTreeItem'

export class ConfigurationItem<
    T extends string | string[]
> extends ProjectManagerTreeItem {
    description?: string
    protected parent: CMakeConfiguration
    private value: T | undefined

    // e.g. "project path", "path/to/project", "The path to the project"
    constructor(
        parent: CMakeConfiguration,
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
        this.refresh()
    }

    getChildren(): ProjectManagerTreeItem[] {
        // TODO we should show values of string[] settings as children
        return []
    }

    getView(): vscode.TreeItem {
        return this
    }

    setParent(parent: CMakeConfiguration) {
        this.parent = parent
    }

    getParent(): CMakeConfiguration | undefined {
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
