import * as vscode from 'vscode'
import { DiscoPoPParser } from '../DiscoPoP/DiscoPoPParser'
import { DiscoPoPRunner } from '../DiscoPoP/DiscoPoPRunner'
import { DiscoPoPResults } from '../DiscoPoP/classes/DiscoPoPResults'
import { HotspotDetectionParser } from '../HotspotDetection/HotspotDetectionParser'
import { HotspotDetectionRunner } from '../HotspotDetection/HotspotDetectionRunner'
import { HotspotDetectionResults } from '../HotspotDetection/classes/HotspotDetectionResults'
import { ConfigurationItem } from './ConfigurationItem'
import { Project } from './Project'
import { ProjectManagerTreeItem } from './ProjectManagerTreeItem'

export class CMakeConfiguration extends ProjectManagerTreeItem {
    parent: Project | undefined

    private _name: string
    private _projectPath: ConfigurationItem<string> | undefined
    private _executableName: ConfigurationItem<string> | undefined
    private _executableArgumentsDiscoPoP: ConfigurationItem<string> | undefined
    private _executableArgumentsHotspotDetection:
        | ConfigurationItem<string[]>
        | undefined
    private _buildDirectory: ConfigurationItem<string> | undefined
    private _cmakeArguments: ConfigurationItem<string> | undefined

    constructor(
        name: string,
        projectPath?: string,
        executableName?: string,
        executableArgumentsDiscoPoP?: string,
        executableArgumentsHotspotDetection?: string[],
        buildDirectory?: string,
        cmakeArguments?: string
    ) {
        super(name, vscode.TreeItemCollapsibleState.Collapsed)
        this.contextValue = 'configuration'
        this.iconPath = new vscode.ThemeIcon('gear')

        this._name = name

        this._projectPath = new ConfigurationItem<string>(
            this,
            'Project Path',
            projectPath,
            'The path to the root directory of the project. It should contain a CMakeLists.txt file.'
        )

        this._cmakeArguments = new ConfigurationItem<string>(
            this,
            'CMake Arguments',
            cmakeArguments,
            'The arguments passed to cmake during the build process'
        )

        this._executableName = new ConfigurationItem<string>(
            this,
            'Executable Name',
            executableName,
            'The name of the executable'
        )
        this._executableArgumentsDiscoPoP = new ConfigurationItem<string>(
            this,
            'Executable Arguments for DiscoPoP',
            executableArgumentsDiscoPoP,
            'The arguments passed to the executable'
        )
        this._executableArgumentsHotspotDetection = new ConfigurationItem<
            string[]
        >(
            this,
            'Executable Arguments for Hotspot Detection',
            executableArgumentsHotspotDetection,
            'The arguments passed to the executable'
        )
        this._buildDirectory = new ConfigurationItem<string>(
            this,
            'Build Directory',
            buildDirectory,
            'Path to where the build should be performed. Also the DiscoPoP results will be stored in this directory.'
        )
    }

    /**
     * Returns a full (runnable) configuration, i.e. a DefaultConfiguration,
     * by combining the given configuration with its default configuration.
     *
     * If the provided configuration is already a DefaultConfiguration, it is returned as is.
     */
    getFullConfiguration(): DefaultConfiguration {
        if (this instanceof DefaultConfiguration) {
            return this
        }

        const defaults = this.getParent().getDefaultConfiguration()
        const combined = new DefaultConfiguration(
            this.getProjectPath() ?? defaults.getProjectPath(),
            this.getExecutableName() ?? defaults.getExecutableName(),
            this.getExecutableArgumentsDiscoPoP() ??
                defaults.getExecutableArgumentsDiscoPoP(),
            this.getExecutableArgumentsHotspotDetection() ??
                defaults.getExecutableArgumentsHotspotDetection(),
            this.getBuildDirectory() ?? defaults.getBuildDirectory(),
            this.getName() ?? defaults.getName()
        )

        combined.setName(this.getName())

        return combined
    }

    getChildren(): ProjectManagerTreeItem[] {
        return [
            this._projectPath,
            this._cmakeArguments,
            this._executableName,
            this._executableArgumentsDiscoPoP,
            this._executableArgumentsHotspotDetection,
            this._buildDirectory,
        ]
    }

    getView(): vscode.TreeItem {
        return this
    }

    setParent(parent: Project) {
        this.parent = parent
    }

    getParent(): Project | undefined {
        return this.parent
    }

    async runAndParseDiscoPoP(): Promise<DiscoPoPResults> {
        const fullConfiguration = this.getFullConfiguration()

        this.iconPath = new vscode.ThemeIcon('gear~spin')
        this.refresh()

        try {
            const runCompleted = await DiscoPoPRunner.run({
                projectPath: fullConfiguration.getProjectPath(),
                buildArguments: fullConfiguration.getCMakeArguments(),
                executableName: fullConfiguration.getExecutableName(),
                executableArguments:
                    fullConfiguration.getExecutableArgumentsDiscoPoP(),
                buildPath: fullConfiguration.getDiscoPoPBuildDirectory(),
                dotDiscoPoPPath:
                    fullConfiguration.getDiscoPoPBuildDirectory() +
                    '/.discopop',
            })

            if (!runCompleted) {
                throw new Error('DiscoPoP failed to run')
            }

            return DiscoPoPParser.parse({
                fullConfiguration,
            })
            // note that errors are not caught, but propagated to the caller
        } finally {
            this.iconPath = new vscode.ThemeIcon('gear')
            this.refresh()
        }
    }

    async runAndParseHotspotDetection(): Promise<HotspotDetectionResults> {
        const fullConfiguration = this.getFullConfiguration()
        this.iconPath = new vscode.ThemeIcon('gear~spin')
        this.refresh()

        try {
            const runCompleted = await HotspotDetectionRunner.run({
                configuration: fullConfiguration,
            })

            if (!runCompleted) {
                throw new Error('Hotspot Detection failed to run')
            }

            return HotspotDetectionParser.parse({
                filemappingPath:
                    fullConfiguration.getHotspotDetectionBuildDirectory() +
                    '/.discopop/common_data/FileMapping.txt',
                hotspotsJsonPath:
                    fullConfiguration.getHotspotDetectionBuildDirectory() +
                    '/.discopop/hotspot_detection/Hotspots.json',
            })
        } catch (error) {
            this.iconPath = new vscode.ThemeIcon('gear')
            this.refresh()
            throw error
        } finally {
            this.iconPath = new vscode.ThemeIcon('gear')
            this.refresh()
        }
    }

    // getters and setters for the configuration items (and name)
    // TODO turn them into actual get and set methods

    setName(name: string) {
        this._name = name
        this.label = name
    }

    getName(): string {
        return this._name
    }

    getProjectPath(): string | undefined {
        return this._projectPath?.getValue()
    }

    setProjectPath(projectPath: string) {
        this._projectPath?.setValue(projectPath)
    }

    getExecutableName(): string | undefined {
        return this._executableName?.getValue()
    }

    setExecutableName(executableName: string) {
        this._executableName?.setValue(executableName)
    }

    getExecutableArgumentsDiscoPoP(): string | undefined {
        return this._executableArgumentsDiscoPoP?.getValue()
    }

    setExecutableArgumentsDiscoPoP(executableArguments: string) {
        this._executableArgumentsDiscoPoP?.setValue(executableArguments)
    }

    getExecutableArgumentsHotspotDetection(): string[] | undefined {
        return this._executableArgumentsHotspotDetection?.getValue()
    }

    setExecutableArgumentsHotspotDetection(executableArguments: string[]) {
        this._executableArgumentsHotspotDetection?.setValue(executableArguments)
    }

    getDiscoPoPBuildDirectory(): string | undefined {
        return this.getBuildDirectory() + '/DiscoPoP'
    }

    getHotspotDetectionBuildDirectory(): string {
        return this.getBuildDirectory() + '/HotspotDetection'
    }

    getBuildDirectory(): string | undefined {
        return this._buildDirectory?.getValue()
    }

    setBuildDirectory(buildDirectory: string) {
        this._buildDirectory?.setValue(buildDirectory)
    }

    getCMakeArguments(): string | undefined {
        return this._cmakeArguments?.getValue()
    }

    setCMakeArguments(cmakeArguments: string) {
        this._cmakeArguments?.setValue(cmakeArguments)
    }

    // JSON serialization --> avoid circular objects and only store important properties

    toJSONObject(): any {
        return {
            isDefault: false,
            name: this._name,
            projectPath: this._projectPath.getValue(),
            executableName: this._executableName.getValue(),
            executableArgumentsDiscopop:
                this._executableArgumentsDiscoPoP.getValue(),
            executableArgumentsHotspotDetection:
                this._executableArgumentsHotspotDetection.getValue(),
            buildDirectory: this._buildDirectory.getValue(),
            cmakeArguments: this._cmakeArguments.getValue(),
        }
    }

    static fromJSONObject(object: any): CMakeConfiguration {
        const conf = new CMakeConfiguration(
            object.name,
            object.projectPath,
            object.executableName,
            object.executableArgumentsDiscoPoP,
            object.executableArgumentsHotspotDetection,
            object.buildDirectory,
            object.cmakeArguments
        )
        if (object.isDefault) {
            return DefaultConfiguration.fromConfiguration(conf)
        }
        return conf
    }
}

export class DefaultConfiguration extends CMakeConfiguration {
    // in a default configuration, all fields are mandatory and cannot be undefined
    constructor(
        projectPath: string,
        executableName: string,
        executableArgumentsDiscoPoP: string,
        executableArgumentsHotspotDetection: string[],
        buildDirectory: string,
        cmakeArguments: string
    ) {
        super(
            'Default Configuration',
            projectPath,
            executableName,
            executableArgumentsDiscoPoP,
            executableArgumentsHotspotDetection,
            buildDirectory,
            cmakeArguments
        )
        this.contextValue = 'defaultConfiguration'
    }

    static fromConfiguration(
        configuration: CMakeConfiguration
    ): DefaultConfiguration {
        return new DefaultConfiguration(
            configuration.getProjectPath(),
            configuration.getExecutableName(),
            configuration.getExecutableArgumentsDiscoPoP(),
            configuration.getExecutableArgumentsHotspotDetection(),
            configuration.getBuildDirectory(),
            configuration.getCMakeArguments()
        )
    }
}
