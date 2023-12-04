import { TreeItem } from 'vscode'
import {
    Configuration,
    ConfigurationObserver,
    ConfigurationType,
    DiscoPoPViewCapableConfiguration,
    HotspotDetectionViewCapableConfiguration,
} from '../Configuration'
import { ConfigurationTreeItem } from '../ConfigurationTreeItem'
import {
    Property,
    PropertyObserver,
    StringProperty,
    SupportedType,
} from '../Property'

export class ConfigurationViewOnly
    extends Configuration
    implements
        DiscoPoPViewCapableConfiguration,
        HotspotDetectionViewCapableConfiguration,
        PropertyObserver
{
    private readonly _dotDiscoPoPForDiscoPoP: StringProperty
    public get dotDiscoPoPForDiscoPoP(): string {
        return this._dotDiscoPoPForDiscoPoP.value
    }
    public set dotDiscoPoPForDiscoPoP(value: string) {
        this._dotDiscoPoPForDiscoPoP.value = value
        this.refresh()
    }

    private readonly _dotDiscoPoPForHotspotDetection: StringProperty
    public get dotDiscoPoPForHotspotDetection(): string {
        return this._dotDiscoPoPForHotspotDetection.value
    }
    public set dotDiscoPoPForHotspotDetection(value: string) {
        this._dotDiscoPoPForHotspotDetection.value = value
        this.refresh()
    }

    public readonly configurationType = ConfigurationType.ViewOnly

    public constructor(
        name: string,
        onConfigurationChange: ConfigurationObserver,
        dotDiscoPoPForDiscoPoP: string,
        dotDiscoPoPForHotspotDetection
    ) {
        super(name, onConfigurationChange)
        this._dotDiscoPoPForDiscoPoP = new StringProperty(
            '.discopop (DiscoPoP)',
            dotDiscoPoPForDiscoPoP,
            'Enter the path to the .discopop directory that contains the results of the DiscoPoP analysis',
            this
        )
        this._dotDiscoPoPForHotspotDetection = new StringProperty(
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
            this._dotDiscoPoPForDiscoPoP,
            this._dotDiscoPoPForHotspotDetection,
        ]
    }

    toJSON(): any {
        return {
            configurationType: this.configurationType,
            name: this.name,
            dotDiscoPoPForDiscoPoP: this._dotDiscoPoPForDiscoPoP.value,
            dotDiscoPoPForHotspotDetection:
                this._dotDiscoPoPForHotspotDetection.value,
        }
    }

    getDotDiscoPoPForDiscoPoP(): string {
        return this._dotDiscoPoPForDiscoPoP.value
    }

    getDotDiscoPoPForHotspotDetection(): string {
        return this._dotDiscoPoPForHotspotDetection.value
    }
}

// TODO note to self: we should only have a single "load results" button, which will try to find discopop and hotspot detection results and will load whatever exists
