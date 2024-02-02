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
}

export class CustomScripts implements ConfigurationTreeItem, PropertyObserver {
    public constructor(
        private viewOnlyConfig: ConfigurationViewOnly,
        private _scripts: Script[] = []
    ) {
        this._scripts.forEach((script) => script.addObserver(this))
    }

    public addScript(scriptPath: string): void {
        const script = new Script(scriptPath, this)
        this._scripts.push(script)
        this.refresh()
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
