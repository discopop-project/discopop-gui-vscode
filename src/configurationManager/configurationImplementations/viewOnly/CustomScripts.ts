import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from 'vscode'
import { ConfigurationTreeItem } from '../../ConfigurationTreeItem'
import { Property, PropertyObserver, StringProperty } from '../../Property'
import { ConfigurationViewOnly } from './ConfigurationViewOnly'
import { CommandExecution } from '../../../runners/helpers/CommandExecution'

export class Script extends StringProperty {
    // TODO add a way to actually run the script
    // i.e.:
    // - change the context value to "runScriptStringProperty" or sth similar
    // - update package.json:
    //      - add a command to run the script
    //      - update the when clauses so that both edit and run are available here; and only edit is available for pure StringProperty
    // - add a command handler that runs the script

    private static counter = 0
    public constructor(
        scriptPath: string,
        onPropertyChanged: PropertyObserver
    ) {
        super('' + Script.counter++, scriptPath, '', onPropertyChanged)
    }

    public run() {
        CommandExecution.execute({
            command: this.value,
            throwOnNonZeroExitCode: true,
            // cwd?
            // env?
            // cancellation?
        })
    }

    public getView(): TreeItem {
        const treeItem = super.getView()
        treeItem.iconPath = new ThemeIcon('terminal')
        treeItem.label = this.value.split('/').pop() || this.value
        treeItem.description = undefined
        treeItem.tooltip = this.value
        treeItem.contextValue = 'script'
        return treeItem
    }
}

export class CustomScripts implements ConfigurationTreeItem, PropertyObserver {
    public constructor(
        private viewOnlyConfig: ConfigurationViewOnly,
        scripts: string[]
    ) {
        this._scripts = scripts.map((script) => new Script(script, this))
    }

    private _scripts: Script[]
    public addScript(scriptPath: string): void {
        const script = new Script(scriptPath, this)
        this._scripts.push(script)
        this.refresh()
    }
    public removeScript(script: Script): void {
        this._scripts = this._scripts.filter((s) => s !== script)
        this.refresh()
    }
    public get scripts(): string[] {
        return this._scripts.map((script) => script.value)
    }
    public set scripts(scripts: string[]) {
        this._scripts = scripts.map((script) => new Script(script, this))
        this.refresh()
    }

    public get count(): number {
        return this._scripts.length
    }

    public onPropertyChanged(property: Property<string | string[]>): void {
        this.refresh()
    }

    public getView(): TreeItem {
        const treeItem = new TreeItem(
            'Custom Scripts',
            TreeItemCollapsibleState.Collapsed
        )
        treeItem.iconPath = new ThemeIcon('symbol-class')
        treeItem.description = 'TODO'
        treeItem.tooltip = 'TODO'
        treeItem.contextValue = 'customScripts'
        // TODO add a command to add scripts
        return treeItem
    }

    public getChildren(): ConfigurationTreeItem[] {
        return this._scripts
    }

    public refresh(): void {
        this.viewOnlyConfig.refresh()
    }
}
