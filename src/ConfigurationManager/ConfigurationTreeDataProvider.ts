import { SimpleTree } from '../Utils/SimpleTree'
import { Configuration, ConfigurationObserver } from './Configuration'
import { ConfigurationCMake } from './ConfigurationCMake'
import { ConfigurationTreeItem } from './ConfigurationTreeItem'

export class ConfigurationTreeDataProvider
    extends SimpleTree<ConfigurationTreeItem>
    implements ConfigurationObserver
{
    public constructor() {
        super([])
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

    public storeConfigurationsToStableStorage(): void {
        // TODO
    }

    public loadConfigurationsFromStableStorage(): void {
        // TODO
        this.roots.push(
            new ConfigurationCMake(
                'test',
                'test',
                'test',
                'test',
                'test',
                'test',
                ['test1', 'test2'],
                this
            )
        )
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
