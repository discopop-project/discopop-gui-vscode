import { ExtensionContext } from 'vscode'
import { SimpleTree } from '../Utils/SimpleTree'
import { Configuration, ConfigurationObserver } from './Configuration'
import { ConfigurationTreeItem } from './ConfigurationTreeItem'
import configurationFromJSON from './ConfigurationDeserializer'
import { ConfigurationCMake } from './ConfigurationCMake'

export class ConfigurationTreeDataProvider
    extends SimpleTree<ConfigurationTreeItem>
    implements ConfigurationObserver
{
    public constructor(private _context: ExtensionContext) {
        super([])
        this._loadConfigurationsFromStableStorage()
        // this.roots.push(new ConfigurationCMake(
        //     'New Configuration',
        //     "/home/bg/simpleProject/simpleCmake", "/home/bg/simpleProject/simpleCmake/build", "", "hello_world", "dpArgs", ["hdArgs1", "hdArgs2", "hdArgs3"], this  ))
        this.refresh()
    }

    public getConfigurations(): Configuration[] {
        return this.roots as Configuration[]
    }

    public onConfigurationChange(configuration: Configuration): void {
        this.refresh()
    }

    public loadConfigurations(configurations: Configuration[]): void {
        this.roots = configurations
        this.refresh()
    }

    public refresh() {
        this._storeConfigurationsToStableStorage()
        super.refresh()
    }

    private static stableStorageKey = 'configurations'

    private _storeConfigurationsToStableStorage(): void {
        const projects = this.roots.map((c) => (c as Configuration).toJSON())
        const projectsString = JSON.stringify(projects)
        this._context.globalState.update(
            ConfigurationTreeDataProvider.stableStorageKey,
            projectsString
        )
    }

    private _loadConfigurationsFromStableStorage(): void {
        const projectsString = this._context.globalState.get<string>(
            ConfigurationTreeDataProvider.stableStorageKey,
            '[]'
        )
        const projectsJSON = JSON.parse(projectsString) as any[]
        const projects = projectsJSON.map((project) =>
            configurationFromJSON(project, this)
        )
        this.roots = projects
        this.refresh()
    }

    public addConfiguration(configuration: Configuration): void {
        configuration.addObserver(this)
        this.roots.push(configuration)
        this.refresh()
    }

    public removeConfiguration(configuration: Configuration): void {
        configuration.removeObserver(this)
        this.roots = this.roots.filter((c) => c !== configuration)
        this.refresh()
    }
}
