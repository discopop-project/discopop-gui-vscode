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
import { NewRunner } from './TaskRunners/NewRunner'
import { ProjectManager } from './ProjectManager/ProjectManager'
import { Project } from './ProjectManager/Project'
import {
    Configuration,
    DefaultConfiguration,
} from './ProjectManager/Configuration'

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

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.createConfiguration,
            async (defaultConfiguration: boolean): Promise<Configuration> => {
                // let the user specify the name of the configuration
                let configurationName = ''
                if (!defaultConfiguration) {
                    configurationName = await vscode.window.showInputBox({
                        prompt: 'Please enter the name of the configuration',
                        value: 'MyConfiguration',
                    })
                }

                // let the user select a directory
                const projectDirectoryPath = await vscode.window.showOpenDialog(
                    {
                        canSelectFiles: false,
                        canSelectFolders: true,
                        canSelectMany: false,
                        openLabel:
                            'Select a folder that contains a cmake project',
                        title: 'Select a folder that contains a cmake project',
                    }
                )
                if (!projectDirectoryPath) {
                    vscode.window.showErrorMessage('No path was selected!')
                    return
                }

                // TODO let the user specify additional arguments for building

                // let the user specify the executable name
                const executableName = await vscode.window.showInputBox({
                    prompt: 'Please enter the name of the executable',
                    value: 'hello_world',
                })
                if (!executableName || executableName.length === 0) {
                    vscode.window.showErrorMessage(
                        'No executable name was specified! Aborting...'
                    )
                    return
                }

                // let the user specify the arguments for the executable
                const executableArguments = await vscode.window.showInputBox({
                    prompt: 'Please enter the arguments for the executable',
                    value: '',
                })

                if (defaultConfiguration) {
                    return new Configuration(
                        'Default Configuration',
                        projectDirectoryPath[0].fsPath,
                        executableName,
                        executableArguments,
                        Utils.getWorkspacePath() + '/.discopop',
                        ''
                    )
                } else {
                    return new Configuration(
                        configurationName!,
                        projectDirectoryPath[0].fsPath,
                        executableName,
                        executableArguments,
                        Utils.getWorkspacePath() + '/.discopop',
                        ''
                    )
                }
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.createProject, async () => {
            // let the user specify the name of the project
            const projectName = await vscode.window.showInputBox({
                prompt: 'Please enter the name of the project',
                value: 'MyProject',
            })

            // let the user create the default configuration
            const defaultConfiguration: DefaultConfiguration =
                await vscode.commands.executeCommand(
                    Commands.createConfiguration,
                    true
                )
            const project = new Project(projectName, defaultConfiguration)
            vscode.commands.executeCommand(Commands.addProject, project)
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
                        Commands.createConfiguration,
                        false
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
                vscode.window
                    .showWarningMessage(
                        'Are you sure you want to remove this project?',
                        { modal: true },
                        'Yes',
                        'No'
                    )
                    .then((value) => {
                        if (value === 'Yes') {
                            projectTreeDataProvider.removeProject(project)
                        }
                    })
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.renameProject,
            async (project: Project) => {
                vscode.window
                    .showInputBox({
                        prompt: 'Please enter the new name of the project',
                        value: project.getName(),
                    })
                    .then((value) => {
                        if (value) {
                            project.setName(value)
                            projectTreeDataProvider.refresh()
                        }
                    })
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.renameConfiguration,
            async (configuration: Configuration) => {
                vscode.window
                    .showInputBox({
                        prompt: 'Please enter the new name of the Configuration',
                        value: configuration.getName(),
                    })
                    .then((value) => {
                        if (value) {
                            configuration.setName(value)
                            projectTreeDataProvider.refresh()
                        }
                    })
            }
        )
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            Commands.removeConfiguration,
            async (configuration: Configuration) => {
                vscode.window
                    .showWarningMessage(
                        'Are you sure you want to remove this configuration?',
                        { modal: true },
                        'Yes',
                        'No'
                    )
                    .then((value) => {
                        if (value === 'Yes') {
                            configuration
                                .getParent()
                                ?.removeConfiguration(configuration)
                            projectTreeDataProvider.refresh()
                        }
                    })
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
