import { TreeItem } from 'vscode'
import { ConfigurationTreeItem } from './ConfigurationTreeItem'
import { ConfigurationCMake } from './ConfigurationCMake'

export abstract class Configuration implements ConfigurationTreeItem {
    abstract getView(): TreeItem
    abstract getChildren(): ConfigurationTreeItem[] | undefined
    abstract configurationType: ConfigurationType
    /**
     * MUST write the configurationType as one of the properties of the generated JSON object.
     * The developer MUST also update the static method Configuration.fromJSON
     */
    abstract toJSON(): any
    public static fromJSON(json: any): Configuration {
        switch (json.configurationType) {
            case ConfigurationType.CMake:
                return new ConfigurationCMake(
                    json.name,
                    json.projectPath,
                    json.buildPath,
                    json.buildArguments,
                    json.executableName,
                    json.executableArgumentsForDiscoPoP,
                    json.executableArgumentsForHotspotDetection
                )
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
    runDiscoPoP(): void
}

export interface HotspotDetectionViewCapableConfiguration {
    getDotDiscoPoPForHotspotDetection(): string
}

export interface HotspotDetectionRunCapableConfiguration
    extends HotspotDetectionViewCapableConfiguration {
    runHotspotDetection(): void
}

export enum ConfigurationType {
    CMake = 'CMake',
    //ViewOnly = "ViewOnly",
    //Script = "Script",
}
