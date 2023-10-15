import * as vscode from 'vscode'
import { ConfigurationItem, ConfigurationItemType } from './ConfigurationItem'
import { ProjectManagerTreeItem } from './ProjectManagerTreeItem'
import { Project } from './Project'
import { DiscoPoPRunner } from '../DiscoPoPRunner'
import { ProjectManager } from './ProjectManager'

export class Configuration extends ProjectManagerTreeItem {
    private name: string
    parent: Project | undefined

    projectPath: string | undefined
    executableName: string | undefined
    executableArguments: string | undefined
    buildDirectory: string | undefined
    cmakeArguments: string | undefined

    constructor(
        name: string,
        projectPath?: string,
        executableName?: string,
        executableArguments?: string,
        buildDirectory?: string,
        cmakeArguments?: string
    ) {
        super(name, vscode.TreeItemCollapsibleState.Collapsed)
        this.name = name
        this.projectPath = projectPath
        this.executableName = executableName
        this.executableArguments = executableArguments
        this.buildDirectory = buildDirectory
        this.cmakeArguments = cmakeArguments
        this.contextValue = 'configuration'
        this.iconPath = new vscode.ThemeIcon('gear')
    }

    getConfigurationItems(): ConfigurationItem[] {
        return [
            new ConfigurationItem(
                ConfigurationItemType.ProjectPath,
                this.projectPath,
                'The path to the root directory of the project. It should contain a CMakeLists.txt file.'
            ),
            new ConfigurationItem(
                ConfigurationItemType.CMakeArguments,
                this.cmakeArguments,
                'The arguments passed to cmake during the build process'
            ),
            new ConfigurationItem(
                ConfigurationItemType.ExecutableName,
                this.executableName,
                'The name of the executable'
            ),
            new ConfigurationItem(
                ConfigurationItemType.ExecutableArguments,
                this.executableArguments,
                'The arguments passed to the executable'
            ),
            new ConfigurationItem(
                ConfigurationItemType.BuildDirectory,
                this.buildDirectory,
                'Path to where the build should be performed. Also the DiscoPoP results will be stored in this directory.'
            ),
        ]
    }

    setConfigurationItem(
        configurationItemType: ConfigurationItemType,
        value: string
    ) {
        console.log(
            'setConfigurationItem called with: ' +
                configurationItemType +
                ' and value: ' +
                value
        )
        switch (configurationItemType) {
            case ConfigurationItemType.ProjectPath:
                this.projectPath = value
                break
            case ConfigurationItemType.CMakeArguments:
                this.cmakeArguments = value
                break
            case ConfigurationItemType.ExecutableName:
                this.executableName = value
                break
            case ConfigurationItemType.ExecutableArguments:
                this.executableArguments = value
                break
            case ConfigurationItemType.BuildDirectory:
                this.buildDirectory = value
                break
            default:
                throw new Error(
                    'This ConfigurationItemType is not implemented properly: ' +
                        configurationItemType
                )
        }
        ProjectManager.refresh()
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

    run() {
        DiscoPoPRunner.runConfiguration(this)
    }

    setName(name: string) {
        this.name = name
        this.label = name
    }

    getName(): string {
        return this.name
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
            configuration.projectPath!,
            configuration.executableName!,
            configuration.executableArguments!,
            configuration.buildDirectory!,
            configuration.cmakeArguments!
        )
    }
}
