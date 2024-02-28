import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from 'vscode'

import { ConfigurationViewOnly } from './ConfigurationViewOnly'
import { ExecutionResult, CommandExecution } from '../../utils/CommandExecution'
import { ConfigurationTreeItem } from '../ConfigurationTreeItem'
import { StringProperty, PropertyObserver, Property } from '../Property'

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
        private _parent: CustomScripts & PropertyObserver // we may want to separate them in the future
    ) {
        super('' + Script.counter++, scriptPath, '', _parent)
    }

    public get parent(): CustomScripts {
        return this._parent
    }

    public run(): Promise<ExecutionResult> {
        return CommandExecution.execute({
            command: this.value,
            throwOnNonZeroExitCode: false,
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

    public get configuration(): ConfigurationViewOnly {
        return this.viewOnlyConfig
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
        treeItem.description = undefined
        treeItem.tooltip = 'Define custom scripts and run them at will'
        treeItem.contextValue = 'customScripts'
        return treeItem
    }

    public getChildren(): ConfigurationTreeItem[] {
        return this._scripts
    }

    public refresh(): void {
        this.viewOnlyConfig.refresh()
    }
}
