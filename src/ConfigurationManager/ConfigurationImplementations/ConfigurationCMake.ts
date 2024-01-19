import { CancellationError, TreeItem } from 'vscode'
import {
    Configuration,
    ConfigurationObserver,
    ConfigurationType,
    RunCapableConfiguration,
} from '../Configuration'
import {
    Property,
    PropertyObserver,
    StringArrayProperty,
    StringProperty,
    SupportedType,
} from '../Property'
import { DiscoPoPResults } from '../../DiscoPoP/classes/DiscoPoPResults'
import { DiscoPoPCMakeWorkflowUI } from '../../runners/workflows/DiscoPoPCMakeWorkflowUI'
import { HotspotDetectionResults } from '../../HotspotDetection/classes/HotspotDetectionResults'
import { HotspotDetectionCMakeWorkflowUI } from '../../runners/workflows/HotspotDetectionCMakeWorkflowUI'

export class ConfigurationCMake
    extends Configuration
    implements RunCapableConfiguration, PropertyObserver
{
    public constructor(
        name: string,
        projectPath: string,
        buildPath: string,
        buildArguments: string,
        executableName: string,
        executableArgumentsForDiscoPoP: string,
        executableArgumentsForHotspotDetection: string[],
        onConfigurationChange?: ConfigurationObserver
    ) {
        super(name, onConfigurationChange)
        this._projectPath = new StringProperty(
            'Project Path',
            projectPath,
            'The path to the root of the project. Should contain a CMakeLists.txt file.',
            this
        )
        this._buildPath = new StringProperty(
            'Build Path',
            buildPath,
            'Path to a directory where the project will be built.',
            this
        )
        this._buildArguments = new StringProperty(
            'Build Arguments',
            buildArguments,
            'Arguments to pass to the cmake build tool.',
            this
        )
        this._executableName = new StringProperty(
            'Executable Name',
            executableName,
            'Name of the executable to run.',
            this
        )
        this._executableArgumentsForDiscoPoP = new StringProperty(
            'Executable Arguments for DiscoPoP',
            executableArgumentsForDiscoPoP,
            'Arguments to pass to the executable when running DiscoPoP.',
            this
        )
        this._executableArgumentsForHotspotDetection = new StringArrayProperty(
            'Executable Arguments for Hotspot Detection',
            executableArgumentsForHotspotDetection,
            StringProperty,
            'Arguments to pass to the executable when running the Hotspot Detection.',
            this
        )
    }

    onPropertyChanged(
        property: Property<SupportedType | SupportedType[]>
    ): void {
        this.refresh()
    }

    private readonly _projectPath: StringProperty
    public get projectPath(): string {
        return this._projectPath.value
    }
    public set projectPath(value: string) {
        this._projectPath.value = value
        this.refresh()
    }

    // the following paths are based on the build path:
    // path/to/build                      // buildPath
    // path/to/build/.discopop            // analysis results
    // path/to/build/DiscoPoP             // build directory for DiscoPoP
    // path/to/build/HotspotDetection     // build directory for HotspotDetection
    private readonly _buildPath: StringProperty
    public get buildPath(): string {
        return this._buildPath.value
    }
    public set buildPath(value: string) {
        this._buildPath.value = value
        this.refresh()
    }
    public get buildPathForDiscoPoP(): string {
        return this.buildPath + '/DiscoPoP'
    }
    public get buildPathForHotspotDetection(): string {
        return this.buildPath + '/HotspotDetection'
    }
    public get dotDiscoPoP(): string {
        return this.buildPath + '/.discopop'
    }

    private readonly _buildArguments: StringProperty
    public get buildArguments(): string {
        return this._buildArguments.value
    }
    public set buildArguments(value: string) {
        this._buildArguments.value = value
        this.refresh()
    }

    private readonly _executableName: StringProperty
    public get executableName(): string {
        return this._executableName.value
    }
    public set executableName(value: string) {
        this._executableName.value = value
        this.refresh()
    }

    private readonly _executableArgumentsForDiscoPoP: StringProperty
    public get executableArgumentsForDiscoPoP(): string {
        return this._executableArgumentsForDiscoPoP.value
    }
    public set executableArgumentsForDiscoPoP(value: string) {
        this._executableArgumentsForDiscoPoP.value = value
        this.refresh()
    }

    private readonly _executableArgumentsForHotspotDetection: StringArrayProperty
    public get executableArgumentsForHotspotDetection(): string[] {
        return this._executableArgumentsForHotspotDetection.value
    }
    public set executableArgumentsForHotspotDetection(value: string[]) {
        this._executableArgumentsForHotspotDetection.value = value
        this.refresh()
    }

    // TODO note to self: we should add a PropertyGroup class, which will be collapsible and will contain multiple properties to allow changing advanced settings
    // e.g. should another discopop installation be used?
    // e.g. should the build directory be cleared?
    // e.g. should make clean be called?
    // e.g. arguments for the discopop explorer
    // ...

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
        const treeItem = super.getView()
        treeItem.contextValue = 'configuration-runnable'
        return treeItem
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

    public async runDiscoPoP(): Promise<DiscoPoPResults> {
        this.running = true
        try {
            const dpRunner = new DiscoPoPCMakeWorkflowUI(
                this.projectPath,
                this.executableName,
                this.executableArgumentsForDiscoPoP,
                this.buildPathForDiscoPoP,
                this.dotDiscoPoP
            )
            return await dpRunner.run() // await because we want to catch errors here
        } catch (error) {
            throw error
        } finally {
            this.running = false
        }
    }

    public async runHotspotDetection(): Promise<HotspotDetectionResults> {
        this.running = true
        try {
            const hsRunner = new HotspotDetectionCMakeWorkflowUI(
                this.projectPath,
                this.executableName,
                this.executableArgumentsForHotspotDetection,
                this.dotDiscoPoP,
                this.buildPathForHotspotDetection
            )
            return await hsRunner.run() // await because we want to catch errors here
        } catch (error) {
            throw error
        } finally {
            this.running = false
        }
    }
}
