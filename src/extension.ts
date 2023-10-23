// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { Commands } from './Commands'
import { ProjectManager } from './ProjectManager/ProjectManager'
import { Project } from './ProjectManager/Project'
import { Configuration } from './ProjectManager/Configuration'
import { UIPrompts } from './UIPrompts'
import { ConfigurationItem } from './ProjectManager/ConfigurationItem'
import { DetailViewProvider } from './DetailViewProvider'
import { Suggestion } from './DiscoPoP/classes/Suggestion/Suggestion'
import { FileMapping } from './DiscoPoP/classes/FileMapping'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {
    // Projects Sidebar
    const projectManager = ProjectManager.getInstance(context)

    // // CODE LENS
    // const codeLensProvider = new CodeLensProvider(
    //     new FileMapping(new Map<number, string>()),
    //     []
    // )
    // context.subscriptions.push(
    //     vscode.languages.registerCodeLensProvider(
    //         '*', //wildcard all for now
    //         codeLensProvider
    //     )
    // )

    // context.subscriptions.push(
    //     vscode.commands.registerCommand('discopop.enableCodeLens', () => {
    //         vscode.workspace
    //             .getConfiguration('discopop')
    //             .update('recommendationsCodeLens', true, true)
    //     })
    // )

    // context.subscriptions.push(
    //     vscode.commands.registerCommand('discopop.disableCodeLens', () => {
    //         vscode.workspace
    //             .getConfiguration('discopop')
    //             .update('recommendationsCodeLens', false, true)
    //     })
    // )

    // context.subscriptions.push(
    //     vscode.commands.registerCommand(
    //         'discopop.codelensAction',
    //         (recommendationId, fileId, startLine, resultType) => {
    //             codeLensProvider.insertRecommendation(recommendationId)
    //             // treeDataProvider.moveOtherRecommendations(
    //             //     recommendationId,
    //             //     fileId,
    //             //     startLine,
    //             //     resultType
    //             // )
    //         }
    //     )
    // )

    // // REFRESH FILE MAPPING TREE VIEW
    // context.subscriptions.push(
    //     vscode.commands.registerCommand(
    //         Commands.refreshFileMapping,
    //         async () => {
    //             codeLensProvider.hideCodeLenses()
    //             const stateManager = new StateManager(context)
    //             stateManager.save('tree', '')

    //             if (Config.scriptModeEnabled) {
    //                 if (
    //                     fs.existsSync(
    //                         `${Utils.getWorkspacePath()}/.discopop/FileMapping.txt`
    //                     )
    //                 ) {
    //                     const workspaceSM = new StorageManager(context, true)
    //                     const newFileMapping = (await workspaceSM.readFile(
    //                         '.discopop/FileMapping.txt',
    //                         true
    //                     )) as string

    //                     stateManager.save('fileMapping', newFileMapping)
    //                     treeDataProvider.reloadFileMappingFromState()
    //                 }
    //             } else {
    //                 if (
    //                     fs.existsSync(
    //                         `${Utils.getCWD(context)}/FileMapping.txt`
    //                     )
    //                 ) {
    //                     const localSM = new StorageManager(context)
    //                     const newFileMapping = (await localSM.readFile(
    //                         'FileMapping.txt',
    //                         true
    //                     )) as string

    //                     stateManager.save('fileMapping', newFileMapping)
    //                     treeDataProvider.reloadFileMappingFromState()
    //                 }
    //             }
    //         }
    //     )
    // )

    // // JUST PARSE RESULTS
    // context.subscriptions.push(
    //     vscode.commands.registerCommand(Commands.parseResults, async () => {
    //         detailViewProvider.clearView()

    //         // Refresh file mapping here to apply results correctly to the tree view
    //         vscode.commands.executeCommand(Commands.refreshFileMapping)

    //         // Can't build codelenses without paths retrieved by treeDataProvider
    //         vscode.commands.executeCommand(Commands.applyResultsToTreeView)

    //         codeLensProvider.unhideCodeLenses()
    //         codeLensProvider._onDidChangeCodeLenses.fire()
    //     })
    // )

    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.addProject, async () => {
            // query the user for all the necessary information
            const steps = 6
            const projectName = await UIPrompts.genericInputBoxQuery(
                'Create Project',
                'Please enter the project name',
                1,
                steps,
                false
            )
            const projectPath = await UIPrompts.genericOpenDialogQuery(
                'Create Project',
                'Please select the project path',
                2,
                steps
            )
            const executableName = await UIPrompts.genericInputBoxQuery(
                'Create Project',
                'Please enter the executable name',
                3,
                steps,
                false
            )
            const executableArguments = await UIPrompts.genericInputBoxQuery(
                'Create Project',
                'Please enter the executable arguments',
                4,
                steps,
                true
            )
            const buildDirectory = await UIPrompts.genericOpenDialogQuery(
                'Create Project',
                'Please enter the build directory',
                5,
                steps
            )
            const cmakeArguments = await UIPrompts.genericInputBoxQuery(
                'Create Project',
                'Please enter the CMake arguments',
                6,
                steps,
                true
            )

            // create and add the project to the project manager
            const project = new Project(
                projectName,
                projectPath,
                executableName,
                executableArguments,
                buildDirectory,
                cmakeArguments
            )
            ProjectManager.getInstance(context).addProject(project)
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.addConfiguration,
            async (project: Project) => {
                const totalSteps = 6

                // let the user specify the name of the configuration
                const configurationName = await UIPrompts.genericInputBoxQuery(
                    'Create Configuration',
                    'Please enter the name of the configuration',
                    1,
                    totalSteps
                )

                // let the user select a directory
                const projectPath = await UIPrompts.genericOpenDialogQuery(
                    'Create Configuration',
                    'Please select the project directory',
                    2,
                    totalSteps
                )

                // let the user specify the executable name
                const executableName = await UIPrompts.genericInputBoxQuery(
                    'Create Configuration',
                    'Please enter the name of the executable',
                    3,
                    totalSteps
                )

                // let the user specify the arguments for the executable
                const executableArguments =
                    await UIPrompts.genericInputBoxQuery(
                        'Create Configuration',
                        'Please enter the arguments for the executable',
                        4,
                        totalSteps
                    )

                // let the user specify the build directory
                const buildDirectory = await UIPrompts.genericOpenDialogQuery(
                    'Create Configuration',
                    'Please select the build directory',
                    5,
                    totalSteps
                ) // TODO the openDialog only allows to open existing directories, we need to be able to create new directories too
                // TODO default to projectPath/.discopop

                // let the user specify the cmake arguments
                const cmakeArguments = await UIPrompts.genericInputBoxQuery(
                    'Create Configuration',
                    'Please enter the cmake arguments',
                    6,
                    totalSteps
                )

                // create the configuration
                const configuration = new Configuration(
                    configurationName,
                    projectPath,
                    executableName,
                    executableArguments,
                    buildDirectory,
                    cmakeArguments
                )

                // add the configuration to the project
                project.addConfiguration(configuration)
                projectManager.refresh()
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.removeProject,
            async (project: Project) => {
                if (
                    await UIPrompts.actionConfirmed(
                        'Are you sure you want to remove this project?'
                    )
                ) {
                    projectManager.removeProject(project)
                }
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.renameProject,
            async (project: Project) => {
                const value = await vscode.window.showInputBox({
                    prompt: 'Please enter the new name of the project',
                    value: project.getName(),
                })
                if (value) {
                    project.setName(value)
                    projectManager.refresh()
                }
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.renameConfiguration,
            async (configuration: Configuration) => {
                const value = await vscode.window.showInputBox({
                    prompt: 'Please enter the new name of the Configuration',
                    value: configuration.getName(),
                })

                if (value) {
                    configuration.setName(value)
                    projectManager.refresh()
                }
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.copyConfiguration,
            async (configuration: Configuration) => {
                const value = await vscode.window.showInputBox({
                    prompt: 'Please enter the name of the new Configuration',
                    value: configuration.getName() + ' (copy)',
                })
                if (value) {
                    const newConfiguration = new Configuration(
                        value,
                        configuration.getProjectPath(),
                        configuration.getExecutableName(),
                        configuration.getExecutableArguments(),
                        configuration.getBuildDirectory(),
                        configuration.getCMakeArguments()
                    )
                    configuration
                        .getParent()
                        ?.addConfiguration(newConfiguration)
                    projectManager.refresh()
                }
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.removeConfiguration,
            async (configuration: Configuration) => {
                if (
                    await UIPrompts.actionConfirmed(
                        'Are you sure you want to remove this configuration?'
                    )
                ) {
                    configuration
                        .getParent()
                        ?.removeConfiguration(configuration)
                    projectManager.refresh()
                }
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.runConfiguration,
            async (configuration: Configuration) => {
                configuration.run()
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.editConfigurationItem,
            async (configurationItem: ConfigurationItem) => {
                const value = await vscode.window.showInputBox({
                    prompt: 'Please enter the new value',
                    value: configurationItem.getValue(),
                })
                if (value) {
                    configurationItem.setValue(value)
                    projectManager.refresh()
                }
                // TODO deal with the case where the user cancels the input box --> set undefined after requesting confirmation (DO NOT ALLOW THIS FOR DEFAULT CONFIGURATION)
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.showSuggestionDetails,
            async (suggestion: Suggestion, fileMapping: FileMapping) => {
                DetailViewProvider.getInstance(context, suggestion)
                const filePath = fileMapping.getFilePath(suggestion.fileId)
                const document = await vscode.workspace.openTextDocument(
                    filePath
                )
                const editor = await vscode.window.showTextDocument(
                    document,
                    vscode.ViewColumn.Active,
                    false
                )
                const line = new vscode.Position(suggestion.startLine - 1, 0)
                editor.selections = [new vscode.Selection(line, line)]
                const range = new vscode.Range(line, line)
                editor.revealRange(range)
            }
        )
    )
}

// this method is called when your extension is deactivated
export function deactivate() {}
