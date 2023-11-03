import * as vscode from 'vscode'
import { ConfigurationItem } from './ConfigurationItem'
import { ProjectManagerTreeItem } from './ProjectManagerTreeItem'
import { Project } from './Project'
import { DiscoPoPRunner } from '../DiscoPoP/DiscoPoPRunner'
import { ProjectManager } from './ProjectManager'
import { HotspotDetectionRunner } from '../HotspotDetection/HotspotDetectionRunner'

export class Configuration extends ProjectManagerTreeItem {
    private name: string
    parent: Project | undefined

    private projectPath: ConfigurationItem | undefined
    private executableName: ConfigurationItem | undefined
    private executableArguments: ConfigurationItem | undefined
    private buildDirectory: ConfigurationItem | undefined
    private cmakeArguments: ConfigurationItem | undefined

    constructor(
        name: string,
        projectPath?: string,
        executableName?: string,
        executableArguments?: string,
        buildDirectory?: string,
        cmakeArguments?: string
    ) {
        super(name, vscode.TreeItemCollapsibleState.Collapsed)
        this.contextValue = 'configuration'
        this.iconPath = new vscode.ThemeIcon('gear')

        this.name = name

        this.projectPath = new ConfigurationItem(
            this,
            'Project Path',
            projectPath,
            'The path to the root directory of the project. It should contain a CMakeLists.txt file.'
        )
        this.cmakeArguments = new ConfigurationItem(
            this,
            'CMake Arguments',
            cmakeArguments,
            'The arguments passed to cmake during the build process'
        )
        this.executableName = new ConfigurationItem(
            this,
            'Executable Name',
            executableName,
            'The name of the executable'
        )
        this.executableArguments = new ConfigurationItem(
            this,
            'Executable Arguments',
            executableArguments,
            'The arguments passed to the executable'
        )
        this.buildDirectory = new ConfigurationItem(
            this,
            'Build Directory',
            buildDirectory,
            'Path to where the build should be performed. Also the DiscoPoP results will be stored in this directory.'
        )
    }

    getConfigurationItems(): ConfigurationItem[] {
        return [
            this.projectPath,
            this.cmakeArguments,
            this.executableName,
            this.executableArguments,
            this.buildDirectory,
        ]
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
            this.getExecutableArguments() ?? defaults.getExecutableArguments(),
            this.getBuildDirectory() ?? defaults.getBuildDirectory(),
            this.getName() ?? defaults.getName()
        )

        combined.setName(this.getName())

        return combined
    }

    getHotspotDetectionBuildDirectory(): string {
        // TODO: make it configurable
        return this.getBuildDirectory() + '_hotspotDetection'
    }

    getChildren(): ProjectManagerTreeItem[] {
        return this.getConfigurationItems()
    }

    setParent(parent: Project) {
        this.parent = parent
    }

    getParent(): Project | undefined {
        return this.parent
    }

    async runDiscoPoPAndHotspotDetection() {
        await this.runDiscoPoP()
        await this.runHotspotDetection()
    }

    async runDiscoPoP() {
        this.iconPath = new vscode.ThemeIcon('gear~spin')
        ProjectManager.refresh()

        await DiscoPoPRunner.runConfiguration(this)

        this.iconPath = new vscode.ThemeIcon('gear')
        ProjectManager.refresh()
    }

    async runHotspotDetection() {
        this.iconPath = new vscode.ThemeIcon('gear~spin')
        ProjectManager.refresh()

        await HotspotDetectionRunner.runConfiguration(this)

        this.iconPath = new vscode.ThemeIcon('gear')
        ProjectManager.refresh()
    }

    // getters and setters for the configuration items (and name)

    setName(name: string) {
        this.name = name
        this.label = name
    }

    getName(): string {
        return this.name
    }

    getProjectPath(): string | undefined {
        return this.projectPath?.getValue()
    }

    setProjectPath(projectPath: string) {
        this.projectPath?.setValue(projectPath)
    }

    getExecutableName(): string | undefined {
        return this.executableName?.getValue()
    }

    setExecutableName(executableName: string) {
        this.executableName?.setValue(executableName)
    }

    getExecutableArguments(): string | undefined {
        return this.executableArguments?.getValue()
    }

    setExecutableArguments(executableArguments: string) {
        this.executableArguments?.setValue(executableArguments)
    }

    getBuildDirectory(): string | undefined {
        return this.buildDirectory?.getValue()
    }

    setBuildDirectory(buildDirectory: string) {
        this.buildDirectory?.setValue(buildDirectory)
    }

    getCMakeArguments(): string | undefined {
        return this.cmakeArguments?.getValue()
    }

    setCMakeArguments(cmakeArguments: string) {
        this.cmakeArguments?.setValue(cmakeArguments)
    }

    // JSON serialization --> avoid circular objects and only store important properties

    toJSONObject(): any {
        return {
            isDefault: false,
            name: this.name,
            projectPath: this.projectPath.getValue(),
            executableName: this.executableName.getValue(),
            executableArguments: this.executableArguments.getValue(),
            buildDirectory: this.buildDirectory.getValue(),
            cmakeArguments: this.cmakeArguments.getValue(),
        }
    }

    static fromJSONObject(object: any): Configuration {
        const conf = new Configuration(
            object.name,
            object.projectPath,
            object.executableName,
            object.executableArguments,
            object.buildDirectory,
            object.cmakeArguments
        )
        if (object.isDefault) {
            return DefaultConfiguration.fromConfiguration(conf)
        }
        return conf
    }
}

export class DefaultConfiguration extends Configuration {
    // in a default configuration, all fields are mandatory and cannot be undefined
    constructor(
        projectPath: string,
        executableName: string,
        executableArguments: string,
        buildDirectory: string,
        cmakeArguments: string
    ) {
        super(
            'Default Configuration',
            projectPath,
            executableName,
            executableArguments,
            buildDirectory,
            cmakeArguments
        )
        this.contextValue = 'defaultConfiguration'
    }

    static fromConfiguration(
        configuration: Configuration
    ): DefaultConfiguration {
        return new DefaultConfiguration(
            configuration.getProjectPath(),
            configuration.getExecutableName(),
            configuration.getExecutableArguments(),
            configuration.getBuildDirectory(),
            configuration.getCMakeArguments()
        )
    }
}
