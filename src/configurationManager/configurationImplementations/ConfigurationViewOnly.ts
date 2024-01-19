import { TreeItem } from 'vscode'
import {
    Configuration,
    ConfigurationObserver,
    ConfigurationType,
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
    implements PropertyObserver
{
    private readonly _dotDiscoPoP: StringProperty
    public get dotDiscoPoP(): string {
        return this._dotDiscoPoP.value
    }
    public set dotDiscoPoP(value: string) {
        this._dotDiscoPoP.value = value
        this.refresh()
    }

    public readonly configurationType = ConfigurationType.ViewOnly

    public constructor(
        name: string,
        onConfigurationChange: ConfigurationObserver,
        dotDiscoPoP: string
    ) {
        super(name, onConfigurationChange)
        this._dotDiscoPoP = new StringProperty(
            '.discopop (DiscoPoP)',
            dotDiscoPoP,
            'Enter the path to the .discopop directory that contains the results of the DiscoPoP analysis',
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
        return [this._dotDiscoPoP]
    }

    toJSON(): any {
        return {
            configurationType: this.configurationType,
            name: this.name,
            dotDiscoPoP: this._dotDiscoPoP.value,
        }
    }
}
