import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from 'vscode'
import { ConfigurationCMake } from './ConfigurationCMake'
import { ConfigurationTreeItem } from '../../ConfigurationTreeItem'
import { Property, PropertyObserver, StringProperty } from '../../Property'

export class AdvancedConfigurationSettings
    implements ConfigurationTreeItem, PropertyObserver
{
    public constructor(
        private cmakeConfig: ConfigurationCMake,
        overrideExplorerArguments: string = '',
        overrideOptimizerArguments: string = '',
        overrideHotspotDetectionArguments: string = ''
    ) {
        this._overrideExplorerArguments = new StringProperty(
            'Override Explorer Arguments',
            overrideExplorerArguments,
            'If not empty: override the discopop_explorer arguments with the provided string.',
            this
        )
        this._overrideOptimizerArguments = new StringProperty(
            'Override Optimizer Arguments',
            overrideOptimizerArguments,
            'If not empty: override the optimizer arguments with the provided string.',
            this
        )
        this._overrideHotspotDetectionArguments = new StringProperty(
            'Override Hotspot Detection Arguments',
            overrideHotspotDetectionArguments,
            'If not empty: override the hotspot_detection arguments with the provided string.',
            this
        )
    }
    onPropertyChanged(property: Property<string | string[]>): void {
        this.refresh()
    }

    private readonly _overrideExplorerArguments: StringProperty
    public get overrideExplorerArguments(): string {
        return this._overrideExplorerArguments.value
    }
    public set overrideExplorerArguments(value: string) {
        this._overrideExplorerArguments.value = value
        this.refresh()
    }

    private readonly _overrideOptimizerArguments: StringProperty
    public get overrideOptimizerArguments(): string {
        return this._overrideOptimizerArguments.value
    }
    public set overrideOptimizerArguments(value: string) {
        this._overrideOptimizerArguments.value = value
        this.refresh()
    }

    private readonly _overrideHotspotDetectionArguments: StringProperty
    public get overrideHotspotDetectionArguments(): string {
        return this._overrideHotspotDetectionArguments.value
    }
    public set overrideHotspotDetectionArguments(value: string) {
        this._overrideHotspotDetectionArguments.value = value
        this.refresh()
    }

    public getView(): TreeItem {
        const treeItem = new TreeItem(
            'Advanced Settings',
            TreeItemCollapsibleState.Collapsed
        )
        treeItem.description =
            'Override the default arguments for the explorer, optimizer, and hotspot detection.'
        treeItem.iconPath = new ThemeIcon('symbol-class')
        treeItem.tooltip =
            'Override the default arguments for the explorer, optimizer, and hotspot detection.'
        return treeItem
    }

    getChildren(): ConfigurationTreeItem[] {
        return [
            this._overrideExplorerArguments,
            this._overrideOptimizerArguments,
            this._overrideHotspotDetectionArguments,
        ]
    }

    refresh(): void {
        this.cmakeConfig.refresh()
    }
}
