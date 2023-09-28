import * as vscode from 'vscode'
import { Configuration, DefaultConfiguration } from "./Configuration"
import { ProjectManagerTreeItem } from './ProjectManagerTreeItem'
import { Commands } from '../Commands'

// TODO: make it abstract and create subclasses for different project types (Makefile, CMake, Manual, Script, ...)
export class Project extends ProjectManagerTreeItem {
    private name: string
    private defaultConfiguration: DefaultConfiguration
    private configurations: Configuration[] = []

    constructor(name: string, defaultConfiguration: DefaultConfiguration) {
        super(name, vscode.TreeItemCollapsibleState.Collapsed)
        this.name = name
        this.defaultConfiguration = defaultConfiguration
        this.defaultConfiguration.setParent(this)
        this.contextValue = "project"
        this.iconPath = new vscode.ThemeIcon("folder")
    }

    addConfiguration(configuration: Configuration) {
        configuration.setParent(this)
        this.configurations.push(configuration)
    }

    removeConfiguration(configuration: Configuration) {
        this.configurations = this.configurations.filter(c => c !== configuration)
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