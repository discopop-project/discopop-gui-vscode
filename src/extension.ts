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

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let disposables: vscode.Disposable[] = []

export function activate(context: vscode.ExtensionContext) {
    vscode.commands.executeCommand(Commands.initApplication)

    // SIDEBAR
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
                treeDataProvider.moveOtherRecommendations(recommendationId, fileId, startLine, resultType)
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
                stateManager.save('tree', "")

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
    context.subscriptions.push(vscode.commands.registerCommand(Commands.parseResults, async () => {
            detailViewProvider.clearView()

            // Refresh file mapping here to apply results correctly to the tree view
            vscode.commands.executeCommand(Commands.refreshFileMapping)

            // Can't build codelenses without paths retrieved by treeDataProvider
            vscode.commands.executeCommand(Commands.applyResultsToTreeView)

            codeLensProvider.unhideCodeLenses()
            codeLensProvider._onDidChangeCodeLenses.fire()
        }
    ))

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

    // EXECUTE ALL NEW
    context.subscriptions.push(
        vscode.commands.registerCommand(Commands.executeAllNew, async () => {
            // let the user select a directory
            const projectDirectoryPath = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select a folder that contains a cmake project',
                title: 'Select a folder that contains a cmake project',
            })
            if (!projectDirectoryPath) {
                vscode.window.showErrorMessage(
                    'No path was selected!'
                )
                return
            }

            // TODO let the user specify additional arguments for building

            // let the user specify the executable name
            const executableName = await vscode.window.showInputBox({
                prompt: "Please enter the name of the executable",
                value: "hello_world"
            })
            if (!executableName || executableName.length === 0) {
                vscode.window.showErrorMessage(
                    'No executable name was specified! Aborting...'
                )
                return
            }

            // let the user specify the arguments for the executable
            const executableArguments = await vscode.window.showInputBox({
                prompt: "Please enter the arguments for the executable",
                value: ""
            })

            const newRunner = new NewRunner(context, projectDirectoryPath[0].fsPath, executableName, executableArguments)

            newRunner.execute()
        })
    )
}

// this method is called when your extension is deactivated
export function deactivate() {
    if (disposables) {
        disposables.forEach((item) => item.dispose())
    }
    disposables = []
}
