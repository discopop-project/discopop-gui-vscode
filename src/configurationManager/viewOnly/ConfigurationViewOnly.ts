import { TreeItem } from 'vscode'

import { CustomScripts } from './CustomScripts'
import {
    Configuration,
    ConfigurationType,
    ConfigurationObserver,
} from '../Configuration'
import { ConfigurationTreeItem } from '../ConfigurationTreeItem'
import {
    PropertyObserver,
    StringProperty,
    Property,
    SupportedType,
} from '../Property'

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

    private readonly _projectPath: StringProperty

    public get projectPath(): string {
        return this._projectPath.value
    }
    public set projectPath(value: string) {
        this._projectPath.value = value
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
        projectPath: string,
        scripts: string[] = []
    ) {
        super(name, onConfigurationChange)
        this._dotDiscoPoP = new StringProperty(
            '.discopop',
            dotDiscoPoP,
            'Enter the path to the .discopop directory with the analysis results',
            this
        )
        this._projectPath = new StringProperty(
            'Project path',
            projectPath,
            'Enter the path to the project directory',
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
        return [this._dotDiscoPoP, this._projectPath, this._scripts]
    }

    toJSON(): any {
        return {
            configurationType: this.configurationType,
            name: this.name,
            dotDiscoPoP: this.dotDiscoPoP,
            projectPath: this.projectPath,
            scripts: this.scripts,
        }
    }
}
