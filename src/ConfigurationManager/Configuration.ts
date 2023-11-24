import { TreeItem, ThemeIcon, TreeItemCollapsibleState } from 'vscode'
import { ConfigurationTreeItem } from './ConfigurationTreeItem'
import { ConfigurationCMake } from './ConfigurationCMake'

export interface ConfigurationObserver {
    onConfigurationChange(configuration: Configuration): void
}

export abstract class Configuration implements ConfigurationTreeItem {
    public constructor(private _name: string) {
        this._running = false
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
     * The developer MUST also update the static method Configuration.fromJSON
     */
    abstract toJSON(): any
    public static fromJSON(
        json: any,
        observer: ConfigurationObserver
    ): Configuration {
        switch (json.configurationType) {
            case ConfigurationType.CMake:
                return new ConfigurationCMake(
                    json.name,
                    json.projectPath,
                    json.buildPath,
                    json.buildArguments,
                    json.executableName,
                    json.executableArgumentsForDiscoPoP,
                    json.executableArgumentsForHotspotDetection,
                    observer
                )
            case ConfigurationType.ViewOnly:
            case ConfigurationType.Script:
            default:
                throw new Error('Unknown configuration type')
        }
    }
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
