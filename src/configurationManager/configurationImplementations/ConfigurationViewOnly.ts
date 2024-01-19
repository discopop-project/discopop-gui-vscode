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
    StringArrayProperty,
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

    private readonly _scripts: StringArrayProperty
    public get scripts(): string[] {
        return this._scripts.value
    }
    public set scripts(value: string[]) {
        this._scripts.value = value
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
            '.discopop',
            dotDiscoPoP,
            'Enter the path to the .discopop directory with the analysis results',
            this
        )
        this._scripts = new StringArrayProperty(
            'scripts',
            [],
            StringProperty,
            'Add your own scripts and easily execute them from this interface',
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
        if (this._scripts.value.length === 0) {
            return [this._dotDiscoPoP]
        }
        return [this._dotDiscoPoP, this._scripts]
    }

    toJSON(): any {
        return {
            configurationType: this.configurationType,
            name: this.name,
            dotDiscoPoP: this._dotDiscoPoP.value,
        }
    }

    addScript(scriptPath: string): void {
        this._scripts.value.push(scriptPath)
        this.refresh()
    }
}
