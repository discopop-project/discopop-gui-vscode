import * as vscode from 'vscode'
import { ConfigurationTreeItem } from './ConfigurationTreeItem'

export type SupportedType = string | number | boolean

export abstract class Property<T extends SupportedType | SupportedType[]>
    implements ConfigurationTreeItem
{
    public constructor(protected title: string, protected _value: T | T[]) {}

    public abstract getView(): vscode.TreeItem
    public abstract getChildren(): ConfigurationTreeItem[] | undefined

    abstract get value(): T
    abstract set value(value: T)
}

export abstract class PropertyElement<
    T extends SupportedType
> extends Property<T> {
    public constructor(
        title: string,
        protected _value: T,
        private _tooltip?: string
    ) {
        super(title, _value)
    }

    public get value(): T {
        return this._value
    }

    public set value(value: T) {
        this._value = value
    }

    public getView(): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(this.title)
        treeItem.description = this.value.toString()
        treeItem.iconPath = new vscode.ThemeIcon('symbol-field')
        treeItem.contextValue = 'propertyElement'
        treeItem.tooltip = this._tooltip
        return treeItem
    }

    public getChildren(): ConfigurationTreeItem[] | undefined {
        return undefined
    }
}

export class PropertyArray<T extends SupportedType> extends Property<T[]> {
    protected _properties: PropertyElement<T>[] = []

    public constructor(
        title: string,
        _value: T[],
        private c: new (title: string, value: T) => PropertyElement<T>,
        private _tooltip?: string
    ) {
        super(title, _value)
        this._properties = _value.map((v) => new c('', v))
    }

    public get value(): T[] {
        return this._properties.map((p) => p.value)
    }

    public set value(value: T[]) {
        this._properties = value.map((v) => new this.c('', v))
    }

    public getView(): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            this.title,
            vscode.TreeItemCollapsibleState.Collapsed
        )
        treeItem.iconPath = new vscode.ThemeIcon('symbol-class')
        treeItem.contextValue = 'propertyArray'
        treeItem.tooltip = this._tooltip
        return treeItem
    }

    public getChildren(): ConfigurationTreeItem[] | undefined {
        return this._properties
    }
}

// convenience classes:
// also they could in the future override the getView methode e.g. to provide different icons/contextValues/...
export class StringProperty extends PropertyElement<string> {}
export class NumberProperty extends PropertyElement<number> {}
export class BooleanProperty extends PropertyElement<boolean> {}
export class StringArrayProperty extends PropertyArray<string> {}
export class NumberArrayProperty extends PropertyArray<number> {}
export class BooleanArrayProperty extends PropertyArray<boolean> {}
