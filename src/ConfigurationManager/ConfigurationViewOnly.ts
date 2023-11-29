import { TreeItem } from 'vscode'
import {
    Configuration,
    ConfigurationObserver,
    ConfigurationType,
    DiscoPoPViewCapableConfiguration,
    HotspotDetectionViewCapableConfiguration,
} from './Configuration'
import { ConfigurationTreeItem } from './ConfigurationTreeItem'
import {
    Property,
    PropertyObserver,
    StringProperty,
    SupportedType,
} from './Property'

export class ConfigurationViewOnly
    extends Configuration
    implements
        DiscoPoPViewCapableConfiguration,
        HotspotDetectionViewCapableConfiguration,
        PropertyObserver
{
    private dotDiscoPoPForDiscoPoP: StringProperty
    private dotDiscoPoPForHotspotDetection: StringProperty
    public readonly configurationType = ConfigurationType.ViewOnly

    public constructor(
        name: string,
        onConfigurationChange: ConfigurationObserver,
        dotDiscoPoPForDiscoPoP: string,
        dotDiscoPoPForHotspotDetection
    ) {
        super(name, onConfigurationChange)
        this.dotDiscoPoPForDiscoPoP = new StringProperty(
            '.discopop (DiscoPoP)',
            dotDiscoPoPForDiscoPoP,
            'Enter the path to the .discopop directory that contains the results of the DiscoPoP analysis',
            this
        )
        this.dotDiscoPoPForHotspotDetection = new StringProperty(
            '.discopop (HotspotDetection)',
            dotDiscoPoPForHotspotDetection,
            'Enter the path to the .discopop directory that contains the results of the HotspotDetection analysis',
            this
        )
    }

    onPropertyChanged(
        property: Property<SupportedType | SupportedType[]>
    ): void {
        this.refresh()
    }

    getView(): TreeItem {
        const treeItem = super.getView()
        treeItem.contextValue = 'configuration'
        return treeItem
    }

    getChildren(): ConfigurationTreeItem[] {
        return [
            this.dotDiscoPoPForDiscoPoP,
            this.dotDiscoPoPForHotspotDetection,
        ]
    }

    toJSON(): any {
        return {
            configurationType: this.configurationType,
            name: this.name,
            dotDiscoPoPForDiscoPoP: this.dotDiscoPoPForDiscoPoP.value,
            dotDiscoPoPForHotspotDetection:
                this.dotDiscoPoPForHotspotDetection.value,
        }
    }

    getDotDiscoPoPForDiscoPoP(): string {
        return this.dotDiscoPoPForDiscoPoP.value
    }

    getDotDiscoPoPForHotspotDetection(): string {
        return this.dotDiscoPoPForHotspotDetection.value
    }
}

// TODO note to self: we should only have a single "load results" button, which will try to find discopop and hotspot detection results and will load whatever exists
