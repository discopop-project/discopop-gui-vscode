import { SimpleTree } from '../Utils/SimpleTree'
import { Configuration } from './Configuration'
import { ConfigurationCMake } from './ConfigurationCMake'
import { ConfigurationTreeItem } from './ConfigurationTreeItem'

export class ConfigurationTreeDataProvider extends SimpleTree<ConfigurationTreeItem> {
    public constructor() {
        super([])
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
                ['test1', 'test2']
            )
        )
        this.refresh()
    }

    public addConfiguration(configuration: Configuration): void {
        this.roots.push(configuration)
        this.refresh()
    }

    public removeConfiguration(configuration: Configuration): void {
        this.roots = this.roots.filter((c) => c !== configuration)
        this.refresh()
    }
}
