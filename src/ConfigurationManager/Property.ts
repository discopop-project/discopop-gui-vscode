import * as vscode from 'vscode'
import { ConfigurationTreeItem } from './ConfigurationTreeItem'

export type SupportedType = string | number | boolean

export interface PropertyObserver {
    onPropertyChanged(property: Property<SupportedType | SupportedType[]>): void
}

// TODO it would be nice to allow making a property optional
export abstract class Property<T extends SupportedType | SupportedType[]>
    implements ConfigurationTreeItem
{
    public constructor(
        protected title: string,
        protected _value: T | T[],
        protected _tooltip: string,
        onPropertyChanged: PropertyObserver
    ) {
        this.observers.push(onPropertyChanged)
    }

    public abstract getView(): vscode.TreeItem
    public abstract getChildren(): ConfigurationTreeItem[] | undefined

    abstract get value(): T
    abstract set value(value: T)

    private observers: PropertyObserver[] = []
    public addObserver(observer: PropertyObserver) {
        this.observers.push(observer)
    }
    public removeObserver(observer: PropertyObserver) {
        this.observers = this.observers.filter((o) => o !== observer)
    }
    public refresh() {
        this.observers.forEach((observer) => observer.onPropertyChanged(this))
    }
}

export abstract class PropertyElement<
    T extends SupportedType
> extends Property<T> {
    public constructor(
        protected title: string,
        protected _value: T,
        protected _tooltip: string,
        onPropertyChanged: PropertyObserver
    ) {
        super(title, _value, _tooltip, onPropertyChanged)
    }

    public get value(): T {
        return this._value
    }

    public set value(value: T) {
        this._value = value
        this.refresh()
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
        protected title: string,
        protected _value: T[],
        private c: new (
            title: string,
            value: T,
            tooltip: string,
            onPropertyChanged: PropertyObserver
        ) => PropertyElement<T>,
        protected _tooltip: string,
        private _onPropertyChanged: PropertyObserver
    ) {
        super(title, _value, _tooltip, _onPropertyChanged)
        this._properties = _value.map(
            (v) => new c('', v, undefined, _onPropertyChanged)
        )
    }

    public get value(): T[] {
        return this._properties.map((p) => p.value)
    }

    public set value(value: T[]) {
        this._properties = value.map(
            (v) => new this.c('', v, undefined, this._onPropertyChanged)
        )
    }

    public pushValue(value: T): void {
        this._properties.push(
            new this.c('', value, undefined, this._onPropertyChanged)
        )
        this.refresh()
    }

    public removeValue(value: T): void {
        this._properties = this._properties.filter(
            (p) =>
                p.value !== value && p.removeObserver(this._onPropertyChanged)
        )
        this.refresh()
    }

    public removeIndex(index: number): void {
        this._properties = this._properties.filter(
            (p, i) => i !== index && p.removeObserver(this._onPropertyChanged)
        )
        this.refresh()
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
