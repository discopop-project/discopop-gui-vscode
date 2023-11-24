import { TreeItem, TreeItemCollapsibleState } from 'vscode'
import {
    Configuration,
    ConfigurationType,
    DiscoPoPRunCapableConfiguration,
    HotspotDetectionRunCapableConfiguration,
} from './Configuration'
import {
    Property,
    StringArrayProperty,
    StringProperty,
    SupportedType,
} from './Property'

export class ConfigurationCMake
    extends Configuration
    implements
        DiscoPoPRunCapableConfiguration,
        HotspotDetectionRunCapableConfiguration
{
    public constructor(
        public name: string,
        projectPath: string,
        buildPath: string,
        buildArguments: string,
        executableName: string,
        executableArgumentsForDiscoPoP: string,
        executableArgumentsForHotspotDetection: string[]
    ) {
        super()
        this._projectPath = new StringProperty(
            'Project Path',
            projectPath,
            'The path to the root of the project. Should contain a CMakeLists.txt file.'
        )
        this._buildPath = new StringProperty(
            'Build Path',
            buildPath,
            'Path to a directory where the project will be built.'
        )
        this._buildArguments = new StringProperty(
            'Build Arguments',
            buildArguments,
            'Arguments to pass to the cmake build tool.'
        )
        this._executableName = new StringProperty(
            'Executable Name',
            executableName,
            'Name of the executable to run.'
        )
        this._executableArgumentsForDiscoPoP = new StringProperty(
            'Executable Arguments for DiscoPoP',
            executableArgumentsForDiscoPoP,
            'Arguments to pass to the executable when running DiscoPoP.'
        )
        this._executableArgumentsForHotspotDetection = new StringArrayProperty(
            'Executable Arguments for Hotspot Detection',
            executableArgumentsForHotspotDetection,
            StringProperty,
            'Arguments to pass to the executable when running the Hotspot Detection.'
        )
    }

    private readonly _projectPath: StringProperty
    public get projectPath(): string {
        return this._projectPath.value
    }
    public set projectPath(value: string) {
        this._projectPath.value = value
    }

    private readonly _buildPath: StringProperty
    public get buildPath(): string {
        return this._buildPath.value
    }
    public set buildPath(value: string) {
        this._buildPath.value = value
    }

    private readonly _buildArguments: StringProperty
    public get buildArguments(): string {
        return this._buildArguments.value
    }
    public set buildArguments(value: string) {
        this._buildArguments.value = value
    }

    private readonly _executableName: StringProperty
    public get executableName(): string {
        return this._executableName.value
    }
    public set executableName(value: string) {
        this._executableName.value = value
    }

    private readonly _executableArgumentsForDiscoPoP: StringProperty
    public get executableArgumentsForDiscoPoP(): string {
        return this._executableArgumentsForDiscoPoP.value
    }
    public set executableArgumentsForDiscoPoP(value: string) {
        this._executableArgumentsForDiscoPoP.value = value
    }

    private readonly _executableArgumentsForHotspotDetection: StringArrayProperty
    public get executableArgumentsForHotspotDetection(): string[] {
        return this._executableArgumentsForHotspotDetection.value
    }
    public set executableArgumentsForHotspotDetection(value: string[]) {
        this._executableArgumentsForHotspotDetection.value = value
    }

    public configurationType = ConfigurationType.CMake
    public toJSON(): any {
        return {
            configurationType: this.configurationType,
            name: this.name,
            projectPath: this.projectPath,
            buildPath: this.buildPath,
            buildArguments: this.buildArguments,
            executableName: this.executableName,
            executableArgumentsForDiscoPoP: this.executableArgumentsForDiscoPoP,
            executableArgumentsForHotspotDetection:
                this.executableArgumentsForHotspotDetection,
        }
    }

    public getView(): TreeItem {
        return new TreeItem(this.name, TreeItemCollapsibleState.Collapsed)
    }

    public getChildren(): Property<SupportedType | SupportedType[]>[] {
        return [
            this._projectPath,
            this._buildPath,
            this._buildArguments,
            this._executableName,
            this._executableArgumentsForDiscoPoP,
            this._executableArgumentsForHotspotDetection,
        ]
    }

    public getDotDiscoPoPForDiscoPoP(): string {
        throw new Error('Method not implemented.')
    }

    public runDiscoPoP(): void {
        throw new Error('Method not implemented.')
    }

    public getDotDiscoPoPForHotspotDetection(): string {
        throw new Error('Method not implemented.')
    }

    public runHotspotDetection(): void {
        throw new Error('Method not implemented.')
    }
}
