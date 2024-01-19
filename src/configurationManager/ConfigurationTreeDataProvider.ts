import * as vscode from 'vscode'
import { ExtensionContext } from 'vscode'
import { SimpleTree } from '../utils/SimpleTree'
import {
    Configuration,
    ConfigurationObserver,
    ConfigurationType,
} from './Configuration'
import { ConfigurationTreeItem } from './ConfigurationTreeItem'
import configurationFromJSON from './ConfigurationDeserializer'
import { ConfigurationCMake } from './configurationImplementations/ConfigurationCMake'
import { ConfigurationViewOnly } from './configurationImplementations/ConfigurationViewOnly'

export class ConfigurationTreeDataProvider
    extends SimpleTree<ConfigurationTreeItem>
    implements ConfigurationObserver
{
    public constructor(private _context: ExtensionContext) {
        super([])
        this._loadConfigurationsFromStableStorage()
        this.refresh()
    }

    public async createAndAddConfiguration(): Promise<void> {
        // let the user input all the necessary information for a new configuration
        // using a vscode input box
        // TODO this is ugly and should be replaced by a proper UI (nicer path selection, back button, step count, ...)

        const type = await vscode.window.showQuickPick(
            Object.values(ConfigurationType),
            {
                placeHolder: 'Select the type of the project',
                ignoreFocusOut: true,
            }
        )
        if (type === undefined) {
            return
        }

        const name = await vscode.window.showInputBox({
            prompt: 'Enter a name for the configuration',
            ignoreFocusOut: true,
        })
        if (name === undefined) {
            return
        }

        // prefill path values with the current workspace folder or empty string
        let workspaceFolder = ''
        if (
            vscode.workspace.workspaceFolders !== undefined &&
            vscode.workspace.workspaceFolders.length > 0
        ) {
            workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath
        }

        let configuration: Configuration | undefined = undefined
        switch (type) {
            case ConfigurationType.CMake:
                const projectPath = await vscode.window.showInputBox({
                    prompt: 'Enter the path to the project',
                    ignoreFocusOut: true,
                    value: workspaceFolder,
                })
                if (projectPath === undefined) {
                    return
                }

                const buildPath = await vscode.window.showInputBox({
                    prompt: 'Enter the path to the build directory',
                    ignoreFocusOut: true,
                    value: projectPath + '/build',
                })
                if (buildPath === undefined) {
                    return
                }

                const buildArguments = await vscode.window.showInputBox({
                    prompt: 'Enter the build arguments',
                    ignoreFocusOut: true,
                })
                if (buildArguments === undefined) {
                    return
                }

                const executableName = await vscode.window.showInputBox({
                    prompt: 'Enter the name of the executable',
                    ignoreFocusOut: true,
                })
                if (executableName === undefined) {
                    return
                }

                const executableArgumentsForDiscoPoP =
                    await vscode.window.showInputBox({
                        prompt: 'Enter the arguments for DiscoPoP',
                        ignoreFocusOut: true,
                    })
                if (executableArgumentsForDiscoPoP === undefined) {
                    return
                }

                vscode.window.showInformationMessage(
                    'Successfully created a new configuration. Remember to add Arguments for the HotspotDetection before running it!'
                )

                configuration = new ConfigurationCMake(
                    name,
                    projectPath,
                    buildPath,
                    buildArguments,
                    executableName,
                    executableArgumentsForDiscoPoP,
                    [],
                    this
                )
                break
            case ConfigurationType.ViewOnly:
                let dotDiscoPoP = await vscode.window.showInputBox({
                    prompt: 'Enter the path to the .discopop directory.',
                    ignoreFocusOut: true,
                    value: workspaceFolder + '/.discopop',
                })
                if (dotDiscoPoP === undefined) {
                    return
                }

                configuration = new ConfigurationViewOnly(
                    name,
                    this,
                    dotDiscoPoP
                )
                break
            default: // if this happens, likely a new configuration type was added and this switch should be updated
                throw new Error('Unknown configuration type, Aborting...')
        }

        if (configuration) {
            this.addConfiguration(configuration)
        }
    }

    public getConfigurations(): Configuration[] {
        return this.roots as Configuration[]
    }

    public onConfigurationChange(configuration: Configuration): void {
        this.refresh()
    }

    public loadConfigurations(configurations: Configuration[]): void {
        this.roots = configurations
        this.refresh()
    }

    public refresh() {
        this._storeConfigurationsToStableStorage()
        super.refresh()
    }

    private static stableStorageKey = 'configurations'

    private _storeConfigurationsToStableStorage(): void {
        const projects = this.roots.map((c) => (c as Configuration).toJSON())
        const projectsString = JSON.stringify(projects)
        this._context.globalState.update(
            ConfigurationTreeDataProvider.stableStorageKey,
            projectsString
        )
    }

    private _loadConfigurationsFromStableStorage(): void {
        const projectsString = this._context.globalState.get<string>(
            ConfigurationTreeDataProvider.stableStorageKey,
            '[]'
        )
        const projectsJSON = JSON.parse(projectsString) as any[]
        const projects = projectsJSON.map((project) =>
            configurationFromJSON(project, this)
        )
        this.roots = projects
        this.refresh()
    }

    public addConfiguration(configuration: Configuration): void {
        configuration.addObserver(this)
        this.roots.push(configuration)
        this.refresh()
    }

    public removeConfiguration(configuration: Configuration): void {
        configuration.removeObserver(this)
        this.roots = this.roots.filter((c) => c !== configuration)
        this.refresh()
    }
}
