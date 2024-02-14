import { TreeItem } from 'vscode'
import {
    Configuration,
    ConfigurationObserver,
    ConfigurationType,
} from '../../Configuration'
import { ConfigurationTreeItem } from '../../ConfigurationTreeItem'
import {
    Property,
    PropertyObserver,
    StringProperty,
    SupportedType,
} from '../../Property'
import { CustomScripts } from './CustomScripts'

export class ConfigurationViewOnly
    extends Configuration
    implements PropertyObserver
{
    public readonly configurationType = ConfigurationType.ViewOnly

    private readonly _dotDiscoPoP: StringProperty

    public get dotDiscoPoP(): string {
        return this._dotDiscoPoP.value
    }
    public set dotDiscoPoP(value: string) {
        this._dotDiscoPoP.value = value
        this.refresh() // should happen automatically? can we remove this?
    }

    private _scripts: CustomScripts
    public get scripts(): string[] {
        return this._scripts.scripts
    }
    public set scripts(scripts: string[]) {
        this._scripts.scripts = scripts
    }
    addScript(scriptPath: string): void {
        this._scripts.addScript(scriptPath)
    }

    public constructor(
        name: string,
        onConfigurationChange: ConfigurationObserver,
        dotDiscoPoP: string,
        scripts: string[] = []
    ) {
        super(name, onConfigurationChange)
        this._dotDiscoPoP = new StringProperty(
            '.discopop',
            dotDiscoPoP,
            'Enter the path to the .discopop directory with the analysis results',
            this
        )
        this._scripts = new CustomScripts(this, scripts)
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
        // dotDiscoPoP and scripts are the only children
        return [this._dotDiscoPoP, this._scripts]
    }

    toJSON(): any {
        return {
            configurationType: this.configurationType,
            name: this.name,
            dotDiscoPoP: this.dotDiscoPoP,
            scripts: this.scripts,
        }
    }
}
