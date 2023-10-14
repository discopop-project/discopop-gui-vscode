import * as vscode from 'vscode'
import { ConfigurationItem } from './ConfigurationItem'
import { ProjectManagerTreeItem } from './ProjectManagerTreeItem'
import { Project } from './Project'
import { DiscoPoPRunner } from '../DiscoPoPRunner'

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
                'project path',
                this.projectPath,
                'The path to the root directory of the project. It should contain a CMakeLists.txt file.'
            ),
            new ConfigurationItem(
                'cmake arguments',
                this.cmakeArguments,
                'The arguments passed to cmake during the build process'
            ),
            new ConfigurationItem(
                'executable name',
                this.executableName,
                'The name of the executable'
            ),
            new ConfigurationItem(
                'executable arguments',
                this.executableArguments,
                'The arguments passed to the executable'
            ),
            new ConfigurationItem(
                'build directory',
                this.buildDirectory,
                'Path to where the build should be performed. Also the DiscoPoP results will be stored in this directory.'
            ),
        ]
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
