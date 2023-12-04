import * as vscode from 'vscode'
import { TreeItem, ThemeIcon, TreeItemCollapsibleState } from 'vscode'
import { ConfigurationTreeItem } from './ConfigurationTreeItem'
import { Editable } from './Editable'

export interface ConfigurationObserver {
    onConfigurationChange(configuration: Configuration): void
}

export abstract class Configuration implements ConfigurationTreeItem, Editable {
    public constructor(
        private _name: string,
        onConfigurationChange: ConfigurationObserver
    ) {
        this._running = false
        if (onConfigurationChange !== undefined) {
            this.addObserver(onConfigurationChange)
        }
    }
    getView(): TreeItem {
        const treeItem = new TreeItem(
            this.name,
            TreeItemCollapsibleState.Collapsed
        )
        treeItem.contextValue = 'configuration'
        treeItem.iconPath = this.running
            ? new ThemeIcon('gear~spin')
            : new ThemeIcon('gear')
        return treeItem
    }

    public get name(): string {
        return this._name
    }
    public set name(value: string) {
        this._name = value
        this.refresh()
    }

    public async edit(): Promise<void> {
        // let the user input a new name for the configuration using a vscode input box
        const value = await vscode.window.showInputBox({
            prompt: 'Enter a new name',
        })
        if (value !== undefined) {
            this.name = value
        }
    }

    private _running: boolean
    public get running(): boolean {
        return this._running
    }
    public set running(value: boolean) {
        this._running = value
        this.refresh()
    }

    private observers: ConfigurationObserver[] = []

    public refresh() {
        this.observers.forEach((observer) =>
            observer.onConfigurationChange(this)
        )
    }

    public addObserver(observer: ConfigurationObserver) {
        this.observers.push(observer)
    }

    public removeObserver(observer: ConfigurationObserver) {
        this.observers = this.observers.filter((o) => o !== observer)
    }

    abstract getChildren(): ConfigurationTreeItem[] | undefined
    abstract configurationType: ConfigurationType
    /**
     * MUST write the configurationType as one of the properties of the generated JSON object.
     * The developer MUST also update the static method ConfigurationDeserializer.configurationFromJSON
     */
    abstract toJSON(): any
}

export interface DiscoPoPViewCapableConfiguration {
    getDotDiscoPoPForDiscoPoP(): string
}
export interface DiscoPoPRunCapableConfiguration
    extends DiscoPoPViewCapableConfiguration {
    /** @returns true if successfully completed, false if errors occured or aborted */
    runDiscoPoP(): Promise<boolean>
}

export interface HotspotDetectionViewCapableConfiguration {
    getDotDiscoPoPForHotspotDetection(): string
}

export interface HotspotDetectionRunCapableConfiguration
    extends HotspotDetectionViewCapableConfiguration {
    /** @returns true if successfully completed, false if errors occured or aborted */
    runHotspotDetection(): Promise<boolean>
}

export enum ConfigurationType {
    CMake = 'CMake',
    ViewOnly = 'ViewOnly',
    Script = 'Script',
}
