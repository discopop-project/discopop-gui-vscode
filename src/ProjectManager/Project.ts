import * as vscode from 'vscode'
import { Configuration, DefaultConfiguration } from './Configuration'
import { ProjectManagerTreeItem } from './ProjectManagerTreeItem'
import { Commands } from '../Commands'

// TODO: make it abstract and create subclasses for different project types (Makefile, CMake, Manual, Script, ...)
/**
 * Represents a project in the project manager tree view.
 * Each project has a name and a runnable default configuration.
 * Additional configurations can be added which will override the parameters of the default configuration.
 */
export class Project extends ProjectManagerTreeItem {
    private name: string
    private defaultConfiguration: DefaultConfiguration
    private configurations: Configuration[] = []

    // for UI:
    contextValue = 'project' // identify type of the treeItem
    iconPath = new vscode.ThemeIcon('folder')

    constructor(
        name: string,
        projectPath: string,
        executableName: string,
        executableArguments: string,
        buildDirectory: string,
        cmakeArguments: string
    ) {
        super(name, vscode.TreeItemCollapsibleState.Collapsed)
        this.name = name
        this.defaultConfiguration = new DefaultConfiguration(
            projectPath,
            executableName,
            executableArguments,
            buildDirectory,
            cmakeArguments
        )
        this.defaultConfiguration.setParent(this)
    }

    addConfiguration(configuration: Configuration) {
        configuration.setParent(this)
        this.configurations.push(configuration)
    }

    removeConfiguration(configuration: Configuration) {
        this.configurations = this.configurations.filter(
            (c) => c !== configuration
        )
    }

    getDefaultConfiguration(): DefaultConfiguration {
        return this.defaultConfiguration
    }

    getConfigurations(): Configuration[] {
        return [this.defaultConfiguration, ...this.configurations]
    }

    getChildren(): ProjectManagerTreeItem[] {
        return this.getConfigurations()
    }

    getParent(): undefined {
        return undefined
    }

    setName(name: string) {
        this.name = name
        this.label = name
    }

    getName(): string {
        return this.name
    }
}
