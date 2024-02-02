import * as vscode from 'vscode'
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from 'vscode'
import { DiscoPoPResults } from '../discoPoP/classes/DiscoPoPResults'
import { HotspotDetectionResults } from '../hotspotDetection/classes/HotspotDetectionResults'
import { ConfigurationTreeItem } from './ConfigurationTreeItem'
import { Editable } from './Editable'

export interface ConfigurationObserver {
    onConfigurationChange(configuration: Configuration): void
}

export abstract class Configuration implements ConfigurationTreeItem, Editable {
    public constructor(
        private _name: string,
        onConfigurationChange: ConfigurationObserver | undefined
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
    /**
     * MUST write the configurationType as one of the properties of the generated JSON object.
     * The developer MUST also update the static method ConfigurationDeserializer.configurationFromJSON
     */
    abstract toJSON(): any
    abstract configurationType: ConfigurationType

    /**
     * @returns the path to the .discopop directory that contains the results of the DiscoPoP and HotspotDetection analyses
     */
    abstract get dotDiscoPoP(): string
}

export interface RunCapableConfiguration extends Configuration {
    /**
     * Runs DiscoPoP using the configuration's settings. Returns the parsed results
     * @throws if errors occured or the user cancelled the operation
     */
    runDiscoPoP(): Promise<DiscoPoPResults>

    /**
     * Runs the HotspotDetection using the configuration's settings. Returns the parsed results
     * @throws if errors occured
     */
    runHotspotDetection(): Promise<HotspotDetectionResults>

    /**
     * !!! Assumes that DiscoPoP was run before !!!
     * Runs the optimizer using the configuration's settings. Returns the parsed results
     * @throws if errors occured
     */
    runOptimizer(): Promise<DiscoPoPResults>
}

export enum ConfigurationType {
    CMake = 'CMake',
    ViewOnly = 'ViewOnly',
}
