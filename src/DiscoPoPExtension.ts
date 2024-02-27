import * as fs from 'fs'
import * as vscode from 'vscode'
import {
    Configuration,
    RunCapableConfiguration,
} from './configurationManager/Configuration'
import { ConfigurationTreeDataProvider } from './configurationManager/ConfigurationTreeDataProvider'
import configurationFromJSON from './configurationManager/configurationImplementations/ConfigurationDeserializer'
import {
    CustomScripts,
    Script,
} from './configurationManager/configurationImplementations/viewOnly/CustomScripts'
import { DiscoPoPResults } from './discopop/model/DiscoPoPResults'
import { DiscoPoPSuggestion } from './discopop/model/DiscoPoPSuggestion'
import { FileMapping } from './discopop/model/FileMapping'
import { Hotspot } from './discopop/model/Hotspot'
import { HotspotDetectionResults } from './discopop/model/HotspotDetectionResults'
import { DiscoPoPCodeLensProvider } from './discopop/providers/DiscoPoPCodeLensProvider'
import { DiscoPoPDetailViewProvider } from './discopop/providers/DiscoPoPDetailViewProvider'
import { HotspotDetailViewProvider } from './discopop/providers/HotspotDetailViewProvider'
import { HotspotTree } from './discopop/providers/HotspotTree'
import { DiscoPoPSuggestionGroup } from './discopop/providers/discoPoPSuggestionTree/DiscoPoPSuggestionGroup'
import { DiscoPoPSuggestionNode } from './discopop/providers/discoPoPSuggestionTree/DiscoPoPSuggestionNode'
import { SuggestionTree } from './discopop/providers/discoPoPSuggestionTree/DiscoPoPSuggestionTree'
import { ToolSuite } from './runners/ToolSuite'
import { DiscoPoPConfigProvider } from './runners/tools/DiscoPoPConfigProvider'
import { CommandExecution } from './utils/CommandExecution'
import { Commands } from './utils/Commands'
import { Config, SuggestionPreviewMode } from './utils/Config'
import { Decoration } from './utils/Decorations'
import { SimpleTreeNode } from './utils/SimpleTree'
import { UIPrompts } from './utils/UIPrompts'
import { CancellationError } from './utils/cancellation/CancellationError'
import path = require('path')

let extension: DiscoPoPExtension | undefined = undefined

export async function activate(context: vscode.ExtensionContext) {
    extension = new DiscoPoPExtension(context)
    await extension.activate()
}

export function deactivate() {
    extension?.deactivate()
}

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

function _removeDecorations(
    editor: vscode.TextEditor,
    ...decorations: vscode.TextEditorDecorationType[]
) {
    decorations.forEach((decoration) => {
        editor.setDecorations(decoration, [])
    })
}

export class DiscoPoPExtension {
    private _dpResults: DiscoPoPResults | undefined = undefined
    private set dpResults(dpResults: DiscoPoPResults | undefined) {
        this._dpResults?.dispose()
        this._dpResults = dpResults
        this.showDiscoPoPResults()
    }
    private get dpResults() {
        return this._dpResults
    }

    private _hsResults: HotspotDetectionResults | undefined = undefined
    private set hsResults(hsResults: HotspotDetectionResults | undefined) {
        // TODO same pattern as with dpResults
        this._hsResults = hsResults
        this.showHotspotDetectionResults()
    }
    private get hsResults() {
        return this._hsResults
    }

    private configurationTreeDataProvider: ConfigurationTreeDataProvider
    private dp_details: DiscoPoPDetailViewProvider =
        new DiscoPoPDetailViewProvider(undefined)
    private hs_details: HotspotDetailViewProvider =
        new HotspotDetailViewProvider(undefined)

    // TODO I would like to keep all disposables inside the respective classes and let them manage it
    // private suggestionTree = new ...
    // private hotspotTree = new ...
    private codeLensProvider: DiscoPoPCodeLensProvider = undefined
    private hotspotTreeDisposable: vscode.Disposable | undefined = undefined

    private suggestionTree: SuggestionTree | undefined = undefined
    private _suggestionTreeView:
        | vscode.TreeView<
              SimpleTreeNode<DiscoPoPSuggestionGroup | DiscoPoPSuggestionNode>
          >
        | undefined = undefined
    private get suggestionTreeView() {
        return this._suggestionTreeView
    }
    private set suggestionTreeView(
        treeView: vscode.TreeView<
            SimpleTreeNode<DiscoPoPSuggestionGroup | DiscoPoPSuggestionNode>
        >
    ) {
        this._suggestionTreeView = treeView
        this._updateTreeViewTitleAndMessage()

        this.suggestionTree.onDidChangeTreeData(() => {
            this._updateTreeViewTitleAndMessage()
        })
    }

    private markedSuggestions: number[] = []

    public constructor(private context: vscode.ExtensionContext) {
        //this.projectManager = new ProjectManager(context)
        this.configurationTreeDataProvider = new ConfigurationTreeDataProvider(
            context
        )

        const projectViewer = vscode.window.createTreeView(
            'sidebar-projects-view',
            { treeDataProvider: this.configurationTreeDataProvider }
        )
        this.context.subscriptions.push(projectViewer)
    }

    /** shows the suggestions in the sidebar */
    public async showDiscoPoPResults() {
        // update treeDataProvider
        if (!this.suggestionTree) {
            this.suggestionTree = new SuggestionTree(this.dpResults)
        } else {
            this.suggestionTree.replaceData(this.dpResults)
        }

        // update view
        await this.suggestionTreeView?.dispose()
        this.suggestionTreeView = vscode.window.createTreeView(
            'sidebar-suggestions-view',
            {
                treeDataProvider: this.suggestionTree,
                showCollapseAll: false,
                canSelectMany: false,
            }
        )
        this._updateTreeViewTitleAndMessage()

        // enable code lenses for all suggestions
        // TODO we should not create a new code lens provider every time,
        this.codeLensProvider?.dispose()
        this.codeLensProvider = new DiscoPoPCodeLensProvider(
            this.dpResults.fileMapping,
            this.dpResults.lineMapping,
            this.dpResults.appliedStatus,
            this.dpResults.dotDiscoPoP,
            Array.from(this.dpResults.suggestionsByType.values()).flat()
        )

        // set context
        vscode.commands.executeCommand(
            'setContext',
            'discopop.suggestionsAvailable',
            true
        )
    }

    public async showHotspotDetectionResults() {
        // show the hotspots in the sidebar
        const hotspotTree = new HotspotTree(
            undefined, // TODO s.lineMapping,
            this.hsResults
        )
        // TODO we should not create a new tree view every time,
        // but rather update the existing one
        await this.hotspotTreeDisposable?.dispose()
        this.hotspotTreeDisposable = vscode.window.createTreeView(
            'sidebar-hotspots-view',
            {
                treeDataProvider: hotspotTree,
                showCollapseAll: false,
                canSelectMany: false,
            }
        )
    }

    public async activate() {
        vscode.commands.executeCommand(
            'setContext',
            'discopop.codeLensEnabled',
            'undefined' // yes, this is a string, it is supposed to be a string :)
        )

        vscode.commands.executeCommand(
            'setContext',
            'discopop.suggestionsAvailable',
            false
        )

        // issue a warning if DiscoPoP is not installed or the the installed version of DiscoPoP may be incompatible
        const contextProvider = new DiscoPoPConfigProvider()
        if (
            !(await CommandExecution.commandExists(
                'discopop_config_provider',
                false
            ))
        ) {
            vscode.window.showErrorMessage(
                'WARNING: DiscoPoP not found. Please install DiscoPoP.'
            )
        }
        const installedVersion = await contextProvider.version
        const expectedVersion = '3.2.0'
        if (!(installedVersion === expectedVersion)) {
            console.error(
                'Possible version mismatch between DiscoPoP and DiscoPoP VSCode Extension: Installed version: ' +
                    installedVersion +
                    ', Expected version: ' +
                    expectedVersion
            )
            vscode.window
                .showErrorMessage(
                    'WARNING: DiscoPoP version mismatch detected. Please install the correct DiscoPoP version for full compatibility.',
                    'Show details'
                )
                .then((value) => {
                    if (value === 'Show details') {
                        vscode.window.showInformationMessage(
                            'Installed version: ' +
                                installedVersion +
                                '\nExpected version: ' +
                                expectedVersion
                        )
                    }
                })
        }

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.editConfigurationOrProperty,
                async (editable) => {
                    await editable.edit()
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.runDiscoPoP,
                async (configuration: RunCapableConfiguration) => {
                    try {
                        this.dpResults = await configuration.runDiscoPoP()
                    } catch (error: any) {
                        if (error instanceof CancellationError) {
                            UIPrompts.showMessageForSeconds(
                                'DiscoPoP was cancelled'
                            )
                        } else {
                            logAndShowErrorMessageHandler(
                                error,
                                'DiscoPoP failed: '
                            )
                        }
                    }
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.runHotspotDetection,
                async (configuration: RunCapableConfiguration) => {
                    try {
                        this.hsResults =
                            await configuration.runHotspotDetection()
                    } catch (error: any) {
                        if (error instanceof CancellationError) {
                            UIPrompts.showMessageForSeconds(
                                'HotspotDetection was cancelled'
                            )
                        } else {
                            logAndShowErrorMessageHandler(
                                error,
                                'HotspotDetection failed: '
                            )
                        }
                    }
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.runDiscoPoPAndHotspotDetection,
                async (configuration: RunCapableConfiguration) => {
                    // DiscoPoP
                    try {
                        this.dpResults = await configuration.runDiscoPoP()
                    } catch (error: any) {
                        if (error instanceof CancellationError) {
                            UIPrompts.showMessageForSeconds(
                                'DiscoPoP was cancelled'
                            )
                        } else {
                            logAndShowErrorMessageHandler(
                                error,
                                'DiscoPoP failed: '
                            )
                        }
                    }

                    // HotspotDetection
                    try {
                        this.hsResults =
                            await configuration.runHotspotDetection()
                    } catch (error: any) {
                        if (error instanceof CancellationError) {
                            UIPrompts.showMessageForSeconds(
                                'HotspotDetection was cancelled'
                            )
                        } else {
                            logAndShowErrorMessageHandler(
                                error,
                                'HotspotDetection failed: '
                            )
                        }
                    }
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.runOptimizer,
                async (configuration: RunCapableConfiguration) => {
                    try {
                        this.dpResults = await configuration.runOptimizer()
                    } catch (error: any) {
                        if (error instanceof CancellationError) {
                            UIPrompts.showMessageForSeconds(
                                'Optimizer was cancelled'
                            )
                        } else {
                            logAndShowErrorMessageHandler(
                                error,
                                'Optimizer failed: '
                            )
                        }
                    }
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.addConfiguration,
                async () => {
                    this.configurationTreeDataProvider.createAndAddConfiguration()
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.removeConfiguration,
                async (configuration: Configuration) => {
                    if (
                        await UIPrompts.actionConfirmed(
                            `Are you sure you want to remove the configuration "${configuration.name}"?`
                        )
                    ) {
                        this.configurationTreeDataProvider.removeConfiguration(
                            configuration
                        )
                    }
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.copyConfiguration,
                async (configuration: Configuration) => {
                    const configurationJson = configuration.toJSON()
                    const newConfiguration = configurationFromJSON(
                        configurationJson,
                        this.configurationTreeDataProvider
                    )
                    newConfiguration.name = `${newConfiguration.name} (copy)`
                    this.configurationTreeDataProvider.addConfiguration(
                        newConfiguration
                    )
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.loadResults,
                async (configuration: Configuration) => {
                    // DiscoPoP
                    try {
                        this.dpResults = await DiscoPoPResults.parse(
                            configuration.dotDiscoPoP
                        )
                    } catch (error: any) {
                        let message = 'Failed to load DiscoPoP results'
                        if (error.message) {
                            message += ': ' + error.message
                        }
                        UIPrompts.showMessageForSeconds(message, 8)
                    }

                    // HotspotDetection
                    try {
                        this.hsResults = await HotspotDetectionResults.parse(
                            configuration.dotDiscoPoP
                        )
                    } catch (error: any) {
                        let message = 'Failed to load HotspotDetection results'
                        if (error.message) {
                            message += ': ' + error.message
                        }
                        UIPrompts.showMessageForSeconds(message, 8)
                    }
                }
            )
        )

        this.context.subscriptions.push(
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

        this.context.subscriptions.push(
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

        this.context.subscriptions.push(
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

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.showSuggestionDetails,
                async (suggestionId: number) => {
                    const suggestion =
                        this.dpResults.getSuggestionById(suggestionId)
                    this.dp_details.replaceContents(suggestion.pureJSONData)
                    const filePath = this.dpResults.fileMapping.getFilePath(
                        suggestion.fileId
                    )
                    const document = await vscode.workspace.openTextDocument(
                        filePath
                    )
                    const editor = await vscode.window.showTextDocument(
                        document,
                        vscode.ViewColumn.Active,
                        false
                    )
                    const startLine = new vscode.Position(
                        suggestion.getMappedStartLine(
                            this.dpResults.lineMapping
                        ) - 1,
                        0
                    )
                    editor.selections = [
                        new vscode.Selection(startLine, startLine),
                    ]
                    const startLineRange = new vscode.Range(
                        startLine,
                        startLine
                    )
                    editor.revealRange(startLineRange)

                    // highlight the respective code lines
                    // TODO this does not work well with composite suggestions (e.g. simple_gpu)
                    // TODO we should remove the hightlight at some point (currently it disappears only when selecting another suggestion or reopening the file)
                    _removeDecorations(
                        editor,
                        Decoration.YES,
                        Decoration.MAYBE,
                        Decoration.NO,
                        Decoration.SOFT
                    )
                    const entireRange = new vscode.Range(
                        startLine,
                        new vscode.Position(
                            suggestion.getMappedEndLine(
                                this.dpResults.lineMapping
                            ) - 1,
                            0
                        )
                    )
                    editor.setDecorations(Decoration.SOFT, [
                        { range: entireRange },
                    ])
                },
                this
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.showHotspotDetails,
                async (hotspot: Hotspot, fileMapping: FileMapping) => {
                    this.hs_details.replaceContents(hotspot.pureJSONData)
                    const filePath = fileMapping.getFilePath(hotspot.fid)
                    const document = await vscode.workspace.openTextDocument(
                        filePath
                    )
                    const editor = await vscode.window.showTextDocument(
                        document,
                        vscode.ViewColumn.Active,
                        false
                    )
                    let line = new vscode.Position(hotspot.lineNum - 1, 0)
                    if (this.dpResults) {
                        line = new vscode.Position(
                            this.dpResults.lineMapping.getMappedLineNr(
                                hotspot.fid,
                                hotspot.lineNum
                            ) - 1,
                            0
                        )
                    }
                    editor.selections = [new vscode.Selection(line, line)]
                    const range = new vscode.Range(line, line)
                    editor.revealRange(range)

                    // TODO: it would be nice to decorate all hotspots in the file at once and have some option to toggle them
                    // TODO: it would be nice to decorate until the end of the function/loop (but we do not know the line number of the end)

                    // remove all previous decorations
                    _removeDecorations(
                        editor,
                        Decoration.YES,
                        Decoration.MAYBE,
                        Decoration.NO,
                        Decoration.SOFT
                    )

                    // highlight the hotspot
                    let decoration = Decoration.SOFT
                    switch (hotspot.hotness) {
                        case 'YES':
                            decoration = Decoration.YES
                            break
                        case 'MAYBE':
                            decoration = Decoration.MAYBE
                            break
                        case 'NO':
                            decoration = Decoration.NO
                            break
                        default:
                            console.error(
                                'tried to highlight hotspot with unknown hotness: ' +
                                    hotspot.hotness
                            )
                    }
                    editor.setDecorations(decoration, [{ range }])
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.rollbackAllSuggestions,
                async () => {
                    if (
                        Config.suggestionApplySkipConfirmation() ||
                        (await vscode.window.showQuickPick(
                            ['Rollback', 'Cancel'],
                            {
                                placeHolder: `Rollback all suggestions?`,
                                title: `Rollback all suggestions?`,
                            }
                        )) === 'Rollback'
                    ) {
                        const dotDiscoPoP = this.dpResults?.dotDiscoPoP
                        const dpTools = new ToolSuite(dotDiscoPoP)
                        this.codeLensProvider?.wait()
                        const returnCode = await dpTools.discopopPatchApplicator
                            .patchClear()
                            .catch(logAndShowErrorMessageHandler)
                        switch (returnCode) {
                            case 0:
                                UIPrompts.showMessageForSeconds(
                                    'Successfully rolled back all suggestions'
                                )
                                break
                            case 3:
                                UIPrompts.showMessageForSeconds(
                                    'Nothing to rollback, trivially successful'
                                )
                                this.codeLensProvider?.stopWaitingForAppliedStatus()
                                this.codeLensProvider?.stopWaitingForLineMapping()
                                break
                            default:
                                UIPrompts.showMessageForSeconds(
                                    'Failed to rollback all suggestions. Error code: ' +
                                        returnCode
                                )
                                this.codeLensProvider?.stopWaitingForAppliedStatus()
                                this.codeLensProvider?.stopWaitingForLineMapping()
                        }
                    }
                }
            )
        )

        // used by codelenses
        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.applySuggestions,
                async (
                    dotDiscoPoP: string,
                    suggestions: DiscoPoPSuggestion[]
                ) => {
                    let suggestion: DiscoPoPSuggestion | undefined = undefined
                    if (suggestions.length === 1) {
                        suggestion = suggestions[0]
                    } else {
                        // let the user select the suggestion
                        const suggestionQuickPickItem =
                            await vscode.window.showQuickPick(
                                suggestions.map((suggestion) => {
                                    return {
                                        label: `${suggestion.id}`,
                                        description: `${suggestion.type}`,
                                        detail: `${JSON.stringify(
                                            suggestion.pureJSONData
                                        )}`,
                                    }
                                }),
                                {
                                    placeHolder:
                                        'Select the suggestion to apply',
                                }
                            )
                        if (!suggestionQuickPickItem) {
                            return
                        }

                        suggestion = suggestions.find((suggestion) => {
                            return (
                                `${suggestion.id}` ===
                                suggestionQuickPickItem.label
                            )
                        })
                    }

                    this._applySuggestionConfirmed(dotDiscoPoP, suggestion)
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.previewSuggestion,
                async (suggestionNode: DiscoPoPSuggestionNode) => {
                    // find the patch files
                    const suggestion = suggestionNode.suggestion
                    const patchFileUris = fs
                        .readdirSync(
                            path.join(
                                this.dpResults.dotDiscoPoP,
                                'patch_generator',
                                `${suggestion.id}`
                            )
                        )
                        .map((patchFile) => {
                            return vscode.Uri.file(
                                path.join(
                                    this.dpResults.dotDiscoPoP,
                                    'patch_generator',
                                    `${suggestion.id}`,
                                    patchFile
                                )
                            )
                        })

                    const previewMode = Config.suggestionPreviewMode()
                    switch (previewMode) {
                        case SuggestionPreviewMode.EDITOR: {
                            const viewColumn =
                                vscode.window.activeTextEditor?.viewColumn +
                                    1 || vscode.ViewColumn.Beside
                            patchFileUris.forEach((uri) => {
                                vscode.workspace.openTextDocument(uri).then(
                                    (document) => {
                                        vscode.window.showTextDocument(
                                            document,
                                            viewColumn
                                        )
                                    },
                                    (error) => {
                                        logAndShowErrorMessageHandler(
                                            error,
                                            'Failed to open patch file ' +
                                                uri.fsPath +
                                                ': '
                                        )
                                    }
                                )
                            })
                            break
                        }
                        case SuggestionPreviewMode.PEEK: {
                            // show patchFiles starting at line 0
                            const patchFileLocations = patchFileUris.map(
                                (uri) => {
                                    return new vscode.Location(
                                        uri,
                                        new vscode.Position(0, 0)
                                    )
                                }
                            )

                            // the peek will be shown at the endLine of the suggestion
                            const startUri = vscode.Uri.file(
                                this.dpResults.fileMapping.getFilePath(
                                    suggestion.fileId
                                )
                            )
                            const startPosition = new vscode.Position(
                                suggestion.getMappedEndLine(
                                    this.dpResults.lineMapping
                                ) - 1,
                                0
                            )

                            // show the peek
                            const multiple = 'peek'
                            vscode.commands.executeCommand(
                                'editor.action.peekLocations',
                                startUri,
                                startPosition,
                                patchFileLocations,
                                multiple
                            )
                            break
                        }
                        default: {
                            console.error('invalid suggestionPreviewMode')
                            UIPrompts.showMessageForSeconds(
                                'invalid suggestionPreviewMode ' +
                                    previewMode +
                                    ' - please report this bug'
                            )
                        }
                    }
                }
            )
        )

        // used by tree view
        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.applySingleSuggestion,
                async (suggestionNode: DiscoPoPSuggestionNode) => {
                    const suggestion = suggestionNode.suggestion
                    const dotDiscoPoP = this.dpResults.dotDiscoPoP
                    this._applySuggestionConfirmed(dotDiscoPoP, suggestion)
                }
            )
        )

        // used by tree view
        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.rollbackSingleSuggestion,
                async (suggestionNode: DiscoPoPSuggestionNode) => {
                    const suggestion = suggestionNode.suggestion
                    if (
                        Config.suggestionApplySkipConfirmation() ||
                        (await vscode.window.showQuickPick(
                            ['Rollback Suggestion', 'Cancel'],
                            {
                                placeHolder: `Rollback suggestion ${suggestion.id}?`,
                                title: `Rollback suggestion ${suggestion.id}?`,
                            }
                        )) === 'Rollback Suggestion'
                    ) {
                        const dotDiscoPoP = this.dpResults.dotDiscoPoP
                        const dpTools = new ToolSuite(dotDiscoPoP)
                        this.codeLensProvider?.wait()
                        dpTools.discopopPatchApplicator
                            .patchRollback(suggestion.id)
                            .catch((error) => {
                                logAndShowErrorMessageHandler(
                                    error,
                                    `Failed to rollback suggestion ${suggestionNode.suggestion.id}: `
                                )
                                this.codeLensProvider?.stopWaitingForAppliedStatus()
                                this.codeLensProvider?.stopWaitingForLineMapping()
                            })
                    }
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.toggleCodeLens,
                async () => {
                    const currentValue = vscode.workspace
                        .getConfiguration('discopop')
                        .get('recommendationsCodeLens', true)
                    vscode.workspace
                        .getConfiguration('discopop')
                        .update('recommendationsCodeLens', !currentValue, true)
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.enableCodeLens,
                async () => {
                    this.codeLensProvider?.show()
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.disableCodeLens,
                async () => {
                    this.codeLensProvider?.hide()
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.filterSuggestions,
                async () => {
                    // let the user decide what suggestions to show (applied, unapplied, all)
                    const filterQuickPickItem =
                        await vscode.window.showQuickPick(
                            [
                                {
                                    label: 'All (default)',
                                    description: 'Show all suggestions',
                                },
                                {
                                    label: 'Applied',
                                    description:
                                        'Show only applied suggestions',
                                },
                                {
                                    label: 'Unapplied',
                                    description:
                                        'Show only unapplied suggestions',
                                },
                                // {
                                //     label: "All, including unapplicable patterns",
                                //     description: "Show all suggestions, including unapplicable patterns."
                                // }
                            ],
                            {
                                placeHolder: 'Select what suggestions to show',
                            }
                        )
                    if (!filterQuickPickItem) {
                        return
                    }

                    // update treeDataProvider
                    this.suggestionTree?.filter((node) => {
                        if (node instanceof DiscoPoPSuggestionNode) {
                            if (filterQuickPickItem.label === 'Applied') {
                                return (
                                    node.suggestion.isApplied(
                                        this.dpResults.appliedStatus // only show applied suggestions
                                    ) && node.suggestion.applicable_pattern
                                ) // only show applicable patterns
                            } else if (
                                filterQuickPickItem.label === 'Unapplied'
                            ) {
                                return (
                                    !node.suggestion.isApplied(
                                        this.dpResults.appliedStatus // only show unapplied suggestions
                                    ) && node.suggestion.applicable_pattern
                                ) // only show applicable patterns
                            }
                            // All (default)
                            return node.suggestion.applicable_pattern // only show applicable patterns
                        } else {
                            // show all groups (empty groups will internally be removed by the treeDataProvider)
                            return true
                        }
                    })

                    // update view
                    this._updateTreeViewTitleAndMessage()
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.markSuggestionForInteractiveExport,
                async (suggestionNode: DiscoPoPSuggestionNode) => {
                    if (
                        this.markedSuggestions.includes(
                            suggestionNode.suggestion.id
                        )
                    ) {
                        this.markedSuggestions = this.markedSuggestions.filter(
                            (id) => id !== suggestionNode.suggestion.id
                        )
                    } else {
                        this.markedSuggestions.push(
                            suggestionNode.suggestion.id
                        )
                    }
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.createInteractiveExport,
                async () => {
                    if (!this.dpResults) {
                        vscode.window.showErrorMessage(
                            'No DiscoPoP results available.'
                        )
                        return
                    }
                    if (this.markedSuggestions.length === 0) {
                        vscode.window.showErrorMessage(
                            'No suggestions marked for interactive export.'
                        )
                        return
                    }

                    // always reset the marked suggestions first (we work on a copy)
                    const markedSuggestions = []
                    for (const suggestionId of this.markedSuggestions) {
                        markedSuggestions.push(suggestionId)
                    }
                    this.markedSuggestions = []

                    const dotDiscoPoP = this.dpResults.dotDiscoPoP
                    const dpTools = new ToolSuite(dotDiscoPoP)

                    try {
                        // TODO create a workflow for this
                        // - run optimizer
                        // - run optimizer with interactive export
                        // - create patches
                        // - reload discopop results
                        // make sure that aborting leaves everything in a stable state

                        // run optimizer
                        // TODO we probably don't want to run it every time...
                        // for now we leave running the optimizer to the user

                        // create interactive export
                        await dpTools.discopopOptimizer.run({
                            interactiveExport: markedSuggestions,
                        })

                        // create patches
                        await dpTools.discopopPatchGenerator.createOptimizedPatches()

                        // reload discopop results
                        this.dpResults = await DiscoPoPResults.parse(
                            dotDiscoPoP
                        )

                        UIPrompts.showMessageForSeconds(
                            'Interactive export created successfully.'
                        )
                    } catch (error: any) {
                        logAndShowErrorMessageHandler(
                            error,
                            `Failed to create interactive export: `
                        )
                    }
                }
            )
        )
    }

    private async _applySuggestionConfirmed(
        dotDiscoPoP: string,
        suggestion: DiscoPoPSuggestion
    ) {
        // TODO
        // --> we should set the detail view to the suggestion that is being applied
        // --> if hotspot results are available for the loop/function, we should also show them in the detail view
        // --> we could highlight the code lines affected by the suggestion in the editor

        // if settings specify to skip confirmation, apply the suggestion immediately
        if (Config.suggestionApplySkipConfirmation()) {
            this._applySuggestionWithoutConfirmation(dotDiscoPoP, suggestion)
        } else {
            // otherwise, ask for confirmation
            if (
                await UIPrompts.actionConfirmed(
                    `Are you sure you want to apply suggestion ${suggestion.id}? This will modify your source code! You can disable this message in the settings.`
                )
            ) {
                this._applySuggestionWithoutConfirmation(
                    dotDiscoPoP,
                    suggestion
                )
            }
        }
    }

    private async _applySuggestionWithoutConfirmation(
        dotDiscoPoP: string,
        suggestion: DiscoPoPSuggestion
    ) {
        // apply the suggestion
        const dpTools = new ToolSuite(dotDiscoPoP)
        this.codeLensProvider?.wait()
        const returnCode = await dpTools.discopopPatchApplicator.patchApply(
            suggestion.id
        )
        switch (returnCode) {
            case 0:
                UIPrompts.showMessageForSeconds(
                    'Successfully applied suggestion ' + suggestion.id
                )
                break
            default:
                UIPrompts.showMessageForSeconds(
                    'Failed to apply suggestion ' +
                        suggestion.id +
                        '. Error code: ' +
                        returnCode
                )
                this.codeLensProvider?.stopWaitingForAppliedStatus()
                this.codeLensProvider?.stopWaitingForLineMapping()
        }
    }

    private _updateTreeViewTitleAndMessage() {
        if (this.suggestionTreeView && this.suggestionTree && this.dpResults) {
            const visible = this.suggestionTree.countVisible
            const total = this.suggestionTree.countTotalApplicable
            this.suggestionTreeView.title = `Suggestions (${total})`
            if (visible !== total) {
                this.suggestionTreeView.message = `Showing ${visible} out of ${total} suggestions`
                if (visible === 0) {
                    this.suggestionTreeView.message += ` (try changing the filter)`
                }
            } else {
                this.suggestionTreeView.message = undefined
            }
        } else if (this.suggestionTreeView) {
            this.suggestionTreeView.title = `Suggestions`
            this.suggestionTreeView.message = undefined
        }
    }

    public deactivate() {}
}
