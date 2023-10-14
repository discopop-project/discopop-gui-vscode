// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import * as fs from 'fs'
import { Commands } from './Commands'
import { CUGen } from './TaskRunners/CUGen'
import { DepProfiling } from './TaskRunners/DepProfiling'
import { PatternIdentification } from './TaskRunners/PatternIdentification'
import { RedOp } from './TaskRunners/RedOp'
import { StorageManager } from './misc/StorageManager'
import { SidebarProvider } from './Provider/SidebarProvider'
import { ScriptProvider } from './Provider/ScriptProvider'
import { TreeDataProvider, TreeItem } from './Provider/TreeDataProvider'
import Utils from './Utils'
import CodeLensProvider from './Provider/CodeLensProvider'
import { StateManager } from './misc/StateManager'
import DiscoPoPParser from './misc/DiscoPoPParser'
import { DetailViewProvider } from './Provider/DetailViewProvider'
import { Config } from './Config'
import { exec } from 'child_process'
import { ProjectManager } from './ProjectManager/ProjectManager'
import { Project } from './ProjectManager/Project'
import { Configuration } from './ProjectManager/Configuration'
import { UIPrompts } from './UIPrompts'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let disposables: vscode.Disposable[] = []

export function activate(context: vscode.ExtensionContext) {
    vscode.commands.executeCommand(Commands.initApplication)

    // Discopop Settings Sidebar
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'sidebar-settings-view',
            new SidebarProvider(context) // TODO
        )
    )

    // Projects Sidebar
    const projectTreeDataProvider = ProjectManager.getInstance()
    //context.subscriptions.push(
    //    vscode.window.registerTreeDataProvider('sidebar-projects-view', projectTreeDataProvider)
    //)
    const projectViewer = vscode.window.createTreeView(
        'sidebar-projects-view',
        { treeDataProvider: projectTreeDataProvider }
    )
    context.subscriptions.push(projectViewer)

    // EXECUTION Sidebar (will be removed soon)
    const sidebarProvider = new SidebarProvider(context)
    const scriptProvider = new ScriptProvider(context)
    if (Config.scriptModeEnabled) {
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                'execution-view',
                scriptProvider
            )
        )
    } else {
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                'execution-view',
                sidebarProvider
            )
        )
    }

    // DETAIL VIEW
    const detailViewProvider = new DetailViewProvider(context)
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'detail-view',
            detailViewProvider
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.sendToDetail, (id) => {
            detailViewProvider.loadResultData(id)
        })
    )

    // TREE VIEW
    const treeDataProvider = new TreeDataProvider(context, '')
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('explorerId', treeDataProvider)
    )

    // TOGGLE TREE VIEW FILE
    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.toggleEntry,
            (entry: TreeItem) => {
                treeDataProvider.toggleEntry(entry)
            }
        )
    )

    // TOGGLE TREE VIEW FOLDER
    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.toggleFolder,
            (entry: TreeItem) => {
                treeDataProvider.toggleFolder(entry)
            }
        )
    )

    // CODE LENS
    const codeLensProvider = new CodeLensProvider(context)
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            '*', //wildcard all for now
            codeLensProvider
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('discopop.enableCodeLens', () => {
            vscode.workspace
                .getConfiguration('discopop')
                .update('recommendationsCodeLens', true, true)
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('discopop.disableCodeLens', () => {
            vscode.workspace
                .getConfiguration('discopop')
                .update('recommendationsCodeLens', false, true)
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'discopop.codelensAction',
            (recommendationId, fileId, startLine, resultType) => {
                codeLensProvider.insertRecommendation(recommendationId)
                treeDataProvider.moveOtherRecommendations(
                    recommendationId,
                    fileId,
                    startLine,
                    resultType
                )
            }
        )
    )

    // INIT APPLICATION
    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.initApplication, async () => {
            if (!treeDataProvider.loadTreeFromState()) {
                vscode.commands.executeCommand(Commands.refreshFileMapping)
                vscode.window.showInformationMessage(
                    'Loaded tree from FileMapping.txt!'
                )
                return
            }

            vscode.window.showInformationMessage('Loaded tree from tree state!')
        })
    )

    // REFRESH TREE VIEW COMMAND
    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.refreshFileMapping,
            async () => {
                codeLensProvider.hideCodeLenses()
                const stateManager = new StateManager(context)
                stateManager.save('tree', '')

                if (Config.scriptModeEnabled) {
                    if (
                        fs.existsSync(
                            `${Utils.getWorkspacePath()}/.discopop/FileMapping.txt`
                        )
                    ) {
                        const workspaceSM = new StorageManager(context, true)
                        const newFileMapping = (await workspaceSM.readFile(
                            '.discopop/FileMapping.txt',
                            true
                        )) as string

                        stateManager.save('fileMapping', newFileMapping)
                        treeDataProvider.reloadFileMappingFromState()
                    }
                } else {
                    if (
                        fs.existsSync(
                            `${Utils.getCWD(context)}/FileMapping.txt`
                        )
                    ) {
                        const localSM = new StorageManager(context)
                        const newFileMapping = (await localSM.readFile(
                            'FileMapping.txt',
                            true
                        )) as string

                        stateManager.save('fileMapping', newFileMapping)
                        treeDataProvider.reloadFileMappingFromState()
                    }
                }
            }
        )
    )

    // EXECUTE CU GEN
    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.executeCUGen, async () => {
            codeLensProvider.hideCodeLenses()
            vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    cancellable: false,
                    title: 'Generating Computational Units',
                },
                async (progress) => {
                    progress.report({ increment: 0 })

                    const cugenRunner = new CUGen(context)
                    const files = treeDataProvider.getExecutableFiles()
                    if (!files || !files?.length) {
                        vscode.window.showInformationMessage(
                            'Please select at least one file before executing a task!'
                        )
                    }
                    cugenRunner.setFiles(files)
                    await cugenRunner.executeDefault()

                    progress.report({ increment: 100 })
                }
            )
        })
    )

    // EXECUTE DEP PROF
    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.executeDepProf, async () => {
            codeLensProvider.hideCodeLenses()
            vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    cancellable: false,
                    title: 'Profiling Data Dependencies',
                },
                async (progress) => {
                    progress.report({ increment: 0 })

                    const depprofRunner = new DepProfiling(context)

                    const files = treeDataProvider.getExecutableFiles()
                    if (!files || !files?.length) {
                        vscode.window.showInformationMessage(
                            'Please select at least one file before executing a task!'
                        )
                    }
                    depprofRunner.setFiles(files)
                    await depprofRunner.executeDefault()
                    await depprofRunner.executeLinking()
                    await depprofRunner.executeDpRun()

                    progress.report({ increment: 100 })
                }
            )
        })
    )

    // EXECUTE RED OP
    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.executeRedOp, async () => {
            codeLensProvider.hideCodeLenses()
            vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    cancellable: false,
                    title: 'Detecting Reduction Patterns',
                },
                async (progress) => {
                    progress.report({ increment: 0 })

                    const redopRunner = new RedOp(context)

                    const files = treeDataProvider.getExecutableFiles()
                    if (!files || !files?.length) {
                        vscode.window.showInformationMessage(
                            'Please select at least one file before executing a task!'
                        )
                    }
                    redopRunner.setFiles(files)
                    await redopRunner.executeDefault()
                    await redopRunner.linkInstrumentedLoops()
                    await redopRunner.executeDpRunRed()

                    progress.report({ increment: 100 })
                }
            )
        })
    )

    // EXECUTE PATTERN ID
    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.executePatternId, async () => {
            vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    cancellable: false,
                    title: 'Identifying Parallel Patterns',
                },
                async (progress) => {
                    progress.report({ increment: 0 })

                    const patternidRunner = new PatternIdentification(context)
                    await patternidRunner.executeDefault()

                    vscode.commands.executeCommand(
                        Commands.applyResultsToTreeView
                    )

                    codeLensProvider.unhideCodeLenses()
                    codeLensProvider._onDidChangeCodeLenses.fire()

                    progress.report({ increment: 100 })
                }
            )
        })
    )

    // APPLY RESULTS TO TREE VIEW
    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.applyResultsToTreeView,
            async () => {
                detailViewProvider.clearView()

                const parser = new DiscoPoPParser(context, treeDataProvider)

                await parser.parseResultString()
            }
        )
    )

    // JUST PARSE RESULTS
    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.parseResults, async () => {
            detailViewProvider.clearView()

            // Refresh file mapping here to apply results correctly to the tree view
            vscode.commands.executeCommand(Commands.refreshFileMapping)

            // Can't build codelenses without paths retrieved by treeDataProvider
            vscode.commands.executeCommand(Commands.applyResultsToTreeView)

            codeLensProvider.unhideCodeLenses()
            codeLensProvider._onDidChangeCodeLenses.fire()
        })
    )

    // EXECUTE BY SCRIPT
    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.executeByScript, async () => {
            detailViewProvider.clearView()

            const scriptPath = await Utils.handleScriptPath(context)

            if (scriptPath?.length) {
                await new Promise<void>((resolve, reject) => {
                    exec(
                        scriptPath,
                        { cwd: Utils.getWorkspacePath() },
                        (err, stdout, stderr) => {
                            if (err) {
                                console.log(`error: ${err.message}`)
                                vscode.window.showErrorMessage(
                                    `Script execution failed with error message ${err.message}`
                                )
                                reject()
                                return
                            }
                            resolve()
                        }
                    )
                })
            }

            // Refresh file mapping here to apply results correctly to the tree view
            vscode.commands.executeCommand(Commands.refreshFileMapping)

            // Can't build codelenses without paths retrieved by treeDataProvider
            vscode.commands.executeCommand(Commands.applyResultsToTreeView)

            codeLensProvider.unhideCodeLenses()
            codeLensProvider._onDidChangeCodeLenses.fire()
        })
    )

    // EXECUTE ALL
    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.executeAll, async () => {
            // CUGEN
            const cugenRunner = new CUGen(context)
            const files = treeDataProvider.getExecutableFiles()
            if (!files || !files?.length) {
                vscode.window.showInformationMessage(
                    'Please select at least one file before executing a task!'
                )
            }
            cugenRunner.setFiles(files)
            await cugenRunner.executeDefault()

            // DEP PROF
            const depprofRunner = new DepProfiling(context)
            depprofRunner.setFiles(files)
            await depprofRunner.executeDefault()
            await depprofRunner.executeLinking()
            await depprofRunner.executeDpRun()

            const redopRunner = new RedOp(context)
            // RED OP
            redopRunner.setFiles(files)
            await redopRunner.executeDefault()
            await redopRunner.linkInstrumentedLoops()
            await redopRunner.executeDpRunRed()

            const patternidRunner = new PatternIdentification(context)
            await patternidRunner.executeDefault()

            vscode.commands.executeCommand(Commands.applyResultsToTreeView)

            codeLensProvider.unhideCodeLenses()
            codeLensProvider._onDidChangeCodeLenses.fire()
        })
    )

    // TODO check that it is possible to skip steps
    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.createConfiguration,
            async (): Promise<Configuration> => {
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
                return configuration
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.createProject, async () => {
            // query the user for all the necessary information
            const steps = 6
            const projectName = await UIPrompts.genericInputBoxQuery(
                'Create Project',
                'Please enter the project name',
                1,
                steps
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
                steps
            )
            const executableArguments = await UIPrompts.genericInputBoxQuery(
                'Create Project',
                'Please enter the executable arguments',
                4,
                steps
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
                steps
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
            ProjectManager.getInstance().addProject(project)
        })
    )

    // TODO make this more consistent
    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.addConfiguration,
            async (project: Project) => {
                // let the user create another configuration
                const configuration: Configuration =
                    await vscode.commands.executeCommand(
                        Commands.createConfiguration
                    )
                project.addConfiguration(configuration)
                projectTreeDataProvider.refresh()
            }
        )
    )

    // TODO we do not need a command to add a project, we can just call projectTreeDataProvider.addProject(project) directly
    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.addProject,
            async (project: Project) => {
                projectTreeDataProvider.addProject(project)
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.removeProject,
            async (project: Project) => {
                if (
                    UIPrompts.actionConfirmed(
                        'Are you sure you want to remove this project?'
                    )
                ) {
                    projectTreeDataProvider.removeProject(project)
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
                    projectTreeDataProvider.refresh()
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
                    projectTreeDataProvider.refresh()
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
                        configuration.projectPath,
                        configuration.executableName,
                        configuration.executableArguments,
                        configuration.buildDirectory,
                        configuration.cmakeArguments
                    )
                    configuration
                        .getParent()
                        ?.addConfiguration(newConfiguration)
                    projectTreeDataProvider.refresh()
                }
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.removeConfiguration,
            async (configuration: Configuration) => {
                if (
                    UIPrompts.actionConfirmed(
                        'Are you sure you want to remove this configuration?'
                    )
                ) {
                    configuration
                        .getParent()
                        ?.removeConfiguration(configuration)
                    projectTreeDataProvider.refresh()
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
}

// this method is called when your extension is deactivated
export function deactivate() {
    if (disposables) {
        disposables.forEach((item) => item.dispose())
    }
    disposables = []
}
