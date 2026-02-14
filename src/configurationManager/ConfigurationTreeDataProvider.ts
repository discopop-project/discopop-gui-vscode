import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { ExtensionContext } from 'vscode'
import { Commands } from '../utils/Commands'
import { UIPrompts } from '../utils/UIPrompts'
import {
    Configuration,
    ConfigurationObserver,
    ConfigurationType,
} from './Configuration'
import configurationFromJSON from './ConfigurationDeserializer'
import { ConfigurationTreeItem } from './ConfigurationTreeItem'
import { SimpleTree } from '../utils/SimpleTree'
import { ConfigurationCMake } from './cmake/ConfigurationCMake'
import { ConfigurationViewOnly } from './viewOnly/ConfigurationViewOnly'
import { CustomScripts, Script } from './viewOnly/CustomScripts'
import { env } from 'process'
import { getEnvironmentData } from 'worker_threads'

function logAndShowErrorMessageHandler(error: any, optionalMessage?: string) {
    if (optionalMessage) {
        console.error(optionalMessage)
    }
    console.error(error)
    vscode.window.showErrorMessage(
        optionalMessage
            ? optionalMessage + (error.message || error)
            : error.message || error
    )
}

export interface ConfigurationManagerCallbacks {
    loadResults(
        dotDiscopop: string,
        projectPath: string,
        discopopMissingOK?: boolean,
        hotspotsMissingOK?: boolean,
        projectMissingOK?: boolean,
        quiet?: boolean
    ): void
    runDiscoPoP(
        projectPath: string,
        executableName: string,
        executableArgumentsForDiscoPoP: string,
        dotDiscoPoP: string,
        buildPathForDiscoPoP: string,
        buildArguments: string,
        overrideExplorerArguments?: string
    ): Promise<void>
    runHotspotDetection(
        projectPath: string,
        executableName: string,
        executableArgumentsForHotspotDetection: string[],
        dotDiscoPoP: string,
        buildPathForHotspotDetection: string,
        buildArguments: string,
        overrideHotspotArguments?: string
    ): Promise<void>
    runOptimizer(
        dotDiscoPoP: string,
        overrideOptimizerArgs?: string
    ): Promise<void>
}

export class ConfigurationTreeDataProvider
    extends SimpleTree<ConfigurationTreeItem>
    implements ConfigurationObserver
{
    public constructor(
        private readonly _context: ExtensionContext,
        callbacks: ConfigurationManagerCallbacks
    ) {
        super([])

        this._loadConfigurations()

        // ### LOADING RESULTS AND RUNNING DISCOPOP / HOTSPOT_DETECTION ###

        this._context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.loadResults,
                async (configuration: Configuration) => {
                    callbacks.loadResults(
                        configuration.dotDiscoPoP,
                        configuration.projectPath
                    )
                }
            )
        )

        this._context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.runDiscoPoP,
                async (configuration: ConfigurationCMake) => {
                    await callbacks.runDiscoPoP(
                        configuration.projectPath,
                        configuration.executableName,
                        configuration.executableArgumentsForDiscoPoP,
                        configuration.dotDiscoPoP,
                        configuration.buildPathForDiscoPoP,
                        configuration.buildArguments,
                        configuration.overrideExplorerArguments
                    )
                    // TODO deal with cancellation somewhere...?
                    await callbacks.loadResults(
                        configuration.dotDiscoPoP,
                        configuration.projectPath,
                        false,
                        true,
                        false
                    )
                }
            )
        )

        this._context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.runHotspotDetection,
                async (configuration: ConfigurationCMake) => {
                    configuration.running = true
                    try {
                        await callbacks.runHotspotDetection(
                            configuration.projectPath,
                            configuration.executableName,
                            configuration.executableArgumentsForHotspotDetection,
                            configuration.dotDiscoPoP,
                            configuration.buildPathForHotspotDetection,
                            configuration.buildArguments,
                            configuration.overrideHotspotDetectionArguments
                        )
                        callbacks.loadResults(
                            configuration.dotDiscoPoP,
                            configuration.projectPath,
                            true,
                            false,
                            true
                        )
                    } catch (error: any) {
                        // TODO deal with cancellation somewhere else?
                        if (error instanceof vscode.CancellationError) {
                            UIPrompts.showMessageForSeconds(
                                'HotspotDetection was cancelled'
                            )
                        } else {
                            logAndShowErrorMessageHandler(
                                error,
                                'HotspotDetection failed: '
                            )
                        }
                    } finally {
                        configuration.running = false
                    }
                }
            )
        )

        this._context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.runDiscoPoPAndHotspotDetection,
                async (configuration: ConfigurationCMake) => {
                    // TODO surrond with try catch and set "running" (better: move to private helpers)
                    await callbacks.runDiscoPoP(
                        configuration.projectPath,
                        configuration.executableName,
                        configuration.executableArgumentsForDiscoPoP,
                        configuration.dotDiscoPoP,
                        configuration.buildPathForDiscoPoP,
                        configuration.buildArguments,
                        configuration.overrideExplorerArguments
                    )
                    await callbacks.loadResults(
                        configuration.dotDiscoPoP,
                        configuration.projectPath,
                        true,
                        true,
                        true,
                        true
                    )
                    await callbacks.runHotspotDetection(
                        configuration.projectPath,
                        configuration.executableName,
                        configuration.executableArgumentsForHotspotDetection,
                        configuration.dotDiscoPoP,
                        configuration.buildPathForHotspotDetection,
                        configuration.buildArguments,
                        configuration.overrideHotspotDetectionArguments
                    )
                    callbacks.loadResults(
                        configuration.dotDiscoPoP,
                        configuration.projectPath,
                        false,
                        false,
                        false,
                        false
                    )
                }
            )
        )

        this._context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.runOptimizer,
                async (configuration: ConfigurationCMake) => {
                    await callbacks.runOptimizer(
                        configuration.dotDiscoPoP,
                        configuration.overrideOptimizerArguments || undefined
                    )
                    callbacks.loadResults(
                        configuration.dotDiscoPoP,
                        configuration.projectPath,
                        true,
                        true,
                        true
                    )
                }
            )
        )

        // ### CONFIGURATION MANAGMENT ###

        this._context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.addConfiguration,
                async () => {
                    await this.createAndAddConfiguration()
                }
            )
        )

        this._context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.removeConfiguration,
                async (configuration: Configuration) => {
                    this.removeConfiguration(configuration)
                }
            )
        )

        this._context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.copyConfiguration,
                async (configuration: Configuration) => {
                    const configurationJson = configuration.toJSON()
                    const newConfiguration = configurationFromJSON(
                        configurationJson,
                        this
                    )
                    newConfiguration.name = `${newConfiguration.name} (copy)`
                    this.addConfiguration(newConfiguration)
                }
            )
        )

        this._context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.editConfigurationOrProperty,
                async (editable) => {
                    editable.edit()
                }
            )
        )

        this._context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.deleteSelectedConfigurations,
                async () => {
                    const selected = treeView.selection.filter(
                        (item): item is Configuration =>
                            item instanceof Configuration
                    )

                    if (selected.length === 0) {
                        vscode.window.showInformationMessage(
                            'No configuration selected.'
                        )

                        return
                    }

                    selected.forEach((configuartion) =>
                        this.removeConfiguration(configuartion)
                    )
                }
            )
        )

        // ### SCRIPTS ###

        this._context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.addScript,
                async (customScripts: CustomScripts) => {
                    // let the user input the path to the script
                    const config = customScripts.configuration
                    let defaultScriptPath = config.dotDiscoPoP
                    defaultScriptPath = defaultScriptPath.slice(
                        0,
                        defaultScriptPath.lastIndexOf(path.sep)
                    )
                    defaultScriptPath = defaultScriptPath + '/run.sh'
                    const scriptPath = await vscode.window.showInputBox({
                        placeHolder: 'Enter the path to the script',
                        title: 'Add a new script',
                        value: defaultScriptPath,
                    })
                    if (!scriptPath) {
                        return
                    }
                    config.addScript(scriptPath)
                }
            )
        )

        this._context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.runScript,
                async (script: Script) => {
                    // indicate if the script does not exist
                    if (!fs.existsSync(script.value)) {
                        vscode.window.showErrorMessage(
                            `The script "${script.value}" does not exist.`
                        )
                        return
                    }

                    // indicate if the script is not a file
                    if (!fs.statSync(script.value).isFile()) {
                        vscode.window.showErrorMessage(
                            `The script "${script.value}" is not a file.`
                        )
                        return
                    }

                    // indicate if the script is not executable
                    if (!(fs.statSync(script.value).mode & 0o111)) {
                        vscode.window.showErrorMessage(
                            `The script "${script.value}" is not executable.`
                        )
                        return
                    }

                    try {
                        // execute the script
                        // TODO make cancellation possible
                        const execResult = await script.run()
                        // show the output
                        // TODO surely there is a better way to show the output
                        if (execResult.stdout) {
                            vscode.window.showInformationMessage(
                                execResult.stdout
                            )
                        }
                        if (execResult.stderr) {
                            vscode.window.showErrorMessage(execResult.stderr)
                        }
                        if (execResult.exitCode !== 0) {
                            vscode.window.showErrorMessage(
                                `The script "${script.value}" exited with code ${execResult.exitCode}.`
                            )
                        }
                    } catch (error: any) {
                        logAndShowErrorMessageHandler(
                            error,
                            'Failed to run script: '
                        )
                    }
                }
            )
        )

        this._context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.removeScript,
                async (script: Script) => {
                    if (
                        await UIPrompts.actionConfirmed(
                            `Are you sure you want to remove the script "${script.value}"?`
                        )
                    ) {
                        script.parent.removeScript(script)
                    }
                }
            )
        )

        const treeView = vscode.window.createTreeView('sidebar-projects-view', {
            treeDataProvider: this,
            showCollapseAll: true,
            canSelectMany: true,
        })

        treeView.onDidChangeSelection((event) => {
            const selections = event.selection.some(
                (item) => item instanceof Configuration
            )

            vscode.commands.executeCommand(
                'setContext',
                'discopop.hasConfigurationSelection',
                selections
            )
        })

        this._context.subscriptions.push(treeView)
    }

    public async createAndAddConfiguration(): Promise<void> {
        // let the user input all the necessary information for a new configuration

        // type of configuration
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

        // name of configuration
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
            case ConfigurationType.CMake: {
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
                    this,
                    name,
                    projectPath,
                    buildPath,
                    executableName,
                    executableArgumentsForDiscoPoP,
                    []
                    // use default for the buildArguments
                    // use default for all override... arguements
                )
                break
            }
            case ConfigurationType.ViewOnly: {
                const dotDiscoPoP = await vscode.window.showInputBox({
                    prompt: 'Enter the path to the .discopop directory.',
                    ignoreFocusOut: true,
                    value: workspaceFolder + '/.discopop',
                })
                if (dotDiscoPoP === undefined) {
                    return
                }

                const projectPath = await vscode.window.showInputBox({
                    prompt: 'Enter the path to the project',
                    ignoreFocusOut: true,
                    value: workspaceFolder,
                })
                if (projectPath === undefined) {
                    return
                }

                configuration = new ConfigurationViewOnly(
                    name,
                    this,
                    dotDiscoPoP,
                    projectPath
                )
                break
            }
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

    private _loadConfigurationsFromStableStorage(): Configuration[] {
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
        return projects
    }

    private _loadConfigurationsFromUserFolder(
        configurations: Configuration[]
    ): void {
        const user_home_path = process.env.HOME
        const user_home_dp_locations =
            user_home_path + '/.discopop_config/locations.txt'
        // check if file exists and collect candidates
        fs.stat(user_home_dp_locations, (exists) => {
            if (exists === null) {
                // load automatically created configurations
                // read location file contents
                const content: string = fs.readFileSync(
                    user_home_dp_locations,
                    'utf-8'
                )
                const lines: string[] = content.split(/\r?\n/)
                lines.forEach((line) => {
                    if (line.length > 0) {
                        // unpack line
                        const split_line = line.split(' ')
                        const config_label = split_line[0]
                        const config_dir = split_line[1]
                        const project_path = split_line[2] // could not find where or how store happens, so be mindful of this
                        // check if candidates should be considered (that is, if the config_dir is not already in use by a stored configuration)
                        let candidate_valid = true
                        configurations.forEach((config) => {
                            if (config.dotDiscoPoP === config_dir) {
                                candidate_valid = false
                            }
                        })

                        // if candidate valid, add to the list of configurations
                        if (candidate_valid) {
                            const new_configuration = new ConfigurationViewOnly(
                                config_label,
                                this,
                                config_dir,
                                project_path,
                                []
                            )
                            this.roots = this.roots.concat([new_configuration])
                        }
                    }
                })
                this.refresh()
                fs.rm(user_home_dp_locations, (err) => {
                    console.log(user_home_dp_locations + ' was deleted.')
                })
            } else if (exists.code === 'ENOENT') {
                // nothing to load
                return
            }
        })
    }

    private _loadConfigurations(): void {
        const configurations = this._loadConfigurationsFromStableStorage()
        //this._loadConfigurationsFromDummyPath(configurations);
        this._loadConfigurationsFromUserFolder(configurations)
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
