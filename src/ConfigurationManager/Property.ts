import * as vscode from 'vscode'
import { ConfigurationTreeItem } from './ConfigurationTreeItem'
import { Editable } from './Editable'

export type SupportedType = string | number | boolean

export interface PropertyObserver {
    onPropertyChanged(property: Property<SupportedType | SupportedType[]>): void
}

// TODO it would be nice to allow making a property optional
export abstract class Property<T extends SupportedType | SupportedType[]>
    implements ConfigurationTreeItem, Editable
{
    public constructor(
        protected title: string,
        protected _value: T | T[],
        protected tooltip: string,
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
    public abstract edit(): void
}

export abstract class PropertyElement<
    T extends SupportedType
> extends Property<T> {
    public constructor(
        protected title: string,
        protected _value: T,
        protected tooltip: string,
        onPropertyChanged: PropertyObserver
    ) {
        super(title, _value, tooltip, onPropertyChanged)
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
        treeItem.tooltip = this.tooltip
        return treeItem
    }

    public getChildren(): ConfigurationTreeItem[] | undefined {
        return undefined
    }

    public abstract edit(): void
}

export abstract class PropertyArray<T extends SupportedType> extends Property<
    T[]
> {
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
        protected tooltip: string,
        private _onPropertyChanged: PropertyObserver
    ) {
        super(title, _value, tooltip, _onPropertyChanged)
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

    public removeValue(value: T, removeOnlyFirstOccurence = true): void {
        let removed = false
        this._properties = this._properties.filter((p) => {
            // keep it, if we already removed an element and we only want to remove the first occurence
            if (removed && removeOnlyFirstOccurence) {
                return true
            }
            // remove it, if we found the element to remove
            if (p.value === value) {
                removed = true
                p.removeObserver(this._onPropertyChanged)
                return false
            }
            // keep other elements
            return true
        })
        this.refresh()
    }

    public removeIndex(index: number): void {
        this._properties = this._properties.filter(
            (p, i) => i !== index && p.removeObserver(this._onPropertyChanged)
        )
        this.refresh()
    }

    public abstract addElement(): void

    public removeElement(): void {
        vscode.window
            .showQuickPick(
                this._properties.map((p) => p.value.toString()),
                {
                    placeHolder: 'Select an element to remove',
                }
            )
            .then((value) => {
                if (value !== undefined) {
                    this.removeValue(value as T)
                }
            })
    }

    public clear(): void {
        this._properties.forEach((p) =>
            p.removeObserver(this._onPropertyChanged)
        )
        this._properties = []
        this.refresh()
    }

    public edit(): void {
        vscode.window
            .showQuickPick(['Add', 'Remove', 'Clear', 'Cancel'], {
                placeHolder: 'Select an action',
            })
            .then((value) => {
                switch (value) {
                    case 'Add':
                        this.addElement()
                        break
                    case 'Remove':
                        this.removeElement()
                        break
                    case 'Clear':
                        this.clear()
                        break
                    case 'Cancel':
                        break
                }
            })
    }

    public getView(): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            this.title,
            vscode.TreeItemCollapsibleState.Collapsed
        )
        treeItem.iconPath = new vscode.ThemeIcon('symbol-class')
        treeItem.contextValue = 'propertyArray'
        treeItem.tooltip = this.tooltip
        return treeItem
    }

    public getChildren(): ConfigurationTreeItem[] | undefined {
        return this._properties
    }
}

// convenience classes:
// also they could in the future override the getView methode e.g. to provide different icons/contextValues/...
export class StringProperty extends PropertyElement<string> {
    public edit(): void {
        // let the user input a new value using a vscode input box
        vscode.window
            .showInputBox({
                value: this.value,
                prompt:
                    'Please enter a new value for ' +
                    this.title +
                    ' (' +
                    this.tooltip +
                    ')',
                placeHolder: this.title,
            })
            .then((value) => {
                if (value !== undefined) {
                    this.value = value
                }
            })
    }
}
// export class NumberProperty extends PropertyElement<number> {}
// export class BooleanProperty extends PropertyElement<boolean> {}
export class StringArrayProperty extends PropertyArray<string> {
    public async addElement(): Promise<void> {
        // let the user input a new value using a vscode input box
        const value = await vscode.window.showInputBox({
            value: '',
            prompt:
                'Please enter a new value for ' +
                this.title +
                ' (' +
                this.tooltip +
                ')',
            placeHolder: this.title,
        })
        if (value !== undefined) {
            this.pushValue(value)
        }
    }
}
// export class NumberArrayProperty extends PropertyArray<number> {}
// export class BooleanArrayProperty extends PropertyArray<boolean> {}
