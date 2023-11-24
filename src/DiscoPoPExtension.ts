import * as vscode from 'vscode'
import {
    DiscoPoPRunCapableConfiguration,
    DiscoPoPViewCapableConfiguration,
    HotspotDetectionRunCapableConfiguration,
    HotspotDetectionViewCapableConfiguration,
} from './ConfigurationManager/Configuration'
import { ConfigurationTreeDataProvider } from './ConfigurationManager/ConfigurationTreeDataProvider'
import { DiscoPoPCodeLensProvider } from './DiscoPoP/DiscoPoPCodeLensProvider'
import { DiscoPoPDetailViewProvider } from './DiscoPoP/DiscoPoPDetailViewProvider'
import { DiscoPoPParser } from './DiscoPoP/DiscoPoPParser'
import {
    DiscoPoPSuggestionGroup,
    DiscoPoPSuggestionNode,
    SuggestionTree,
} from './DiscoPoP/DiscoPoPSuggestionTree'
import { PatchApplicator } from './DiscoPoP/PatchApplicator'
import { DiscoPoPResults } from './DiscoPoP/classes/DiscoPoPResults'
import { Suggestion } from './DiscoPoP/classes/Suggestion/Suggestion'
import { FileMapping } from './FileMapping/FileMapping'
import { HotspotDetailViewProvider } from './HotspotDetection/HotspotDetailViewProvider'
import { HotspotDetectionParser } from './HotspotDetection/HotspotDetectionParser'
import { HotspotTree } from './HotspotDetection/HotspotTree'
import { Hotspot } from './HotspotDetection/classes/Hotspot'
import { HotspotDetectionResults } from './HotspotDetection/classes/HotspotDetectionResults'
import { UserCancellationError } from './Utils/CancellationError'
import { Commands } from './Utils/Commands'
import { Decoration } from './Utils/Decorations'
import ErrorHandler from './Utils/ErrorHandler'
import { SimpleTreeNode } from './Utils/SimpleTree'
import { Editable } from './ConfigurationManager/Editable'

function _removeDecorations(
    editor: vscode.TextEditor,
    ...decorations: vscode.TextEditorDecorationType[]
) {
    decorations.forEach((decoration) => {
        editor.setDecorations(decoration, [])
    })
}

export class DiscoPoPExtension {
    private configurationTreeDataProvider: ConfigurationTreeDataProvider
    private dpResults: DiscoPoPResults | undefined = undefined
    private hsResults: HotspotDetectionResults | undefined = undefined
    private dp_details: DiscoPoPDetailViewProvider =
        new DiscoPoPDetailViewProvider(undefined)
    private hs_details: HotspotDetailViewProvider =
        new HotspotDetailViewProvider(undefined)

    // TODO I would like to keep all disposables inside the respective classes and let them manage it
    // private suggestionTree = new ...
    // private hotspotTree = new ...
    private codeLensProvider: DiscoPoPCodeLensProvider = undefined
    private hotspotTreeDisposable: vscode.Disposable | undefined = undefined

    private suggestionTreeView:
        | vscode.TreeView<
              SimpleTreeNode<DiscoPoPSuggestionGroup | DiscoPoPSuggestionNode>
          >
        | undefined = undefined

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

    public async showDiscoPoPResults() {
        // show the suggestions in the sidebar
        const suggestionTree = new SuggestionTree(this.dpResults)
        await this.suggestionTreeView?.dispose()
        this.suggestionTreeView = vscode.window.createTreeView(
            'sidebar-suggestions-view',
            {
                treeDataProvider: suggestionTree,
                showCollapseAll: false,
                canSelectMany: false,
            }
        )
        this.suggestionTreeView.title = `Suggestions (${Array.from(
            this.dpResults.suggestionsByType.entries()
        ).reduce((acc, [type, suggestions]) => acc + suggestions.length, 0)})`

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

    public activate() {
        vscode.commands.executeCommand(
            'setContext',
            'discopop.codeLensEnabled',
            'undefined'
        )

        vscode.commands.executeCommand(
            'setContext',
            'discopop.suggestionsAvailable',
            false
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.editConfigurationOrProperty,
                async (editable: Editable) => {
                    await editable.edit()
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.runDiscoPoPAndHotspotDetection,
                async (
                    configuration: DiscoPoPRunCapableConfiguration &
                        HotspotDetectionRunCapableConfiguration
                ) => {
                    try {
                        // DiscoPoP
                        this.dpResults?.dispose()
                        if (await configuration.runDiscoPoP()) {
                            this.dpResults = await DiscoPoPParser.parse({
                                dotDiscoPoP:
                                    configuration.getDotDiscoPoPForDiscoPoP(),
                            })
                            await this.showDiscoPoPResults()
                        } else {
                            console.error('DiscoPoP failed to run')
                        }

                        // HotspotDetection
                        // this.hsResults?.dispose() // TODO refactor to do this like with DiscoPoP ?
                        if (await configuration.runHotspotDetection()) {
                            this.hsResults = await HotspotDetectionParser.parse(
                                {
                                    filemappingPath:
                                        configuration.getDotDiscoPoPForHotspotDetection() +
                                        '/common_data/FileMapping.txt',
                                    hotspotsJsonPath:
                                        configuration.getDotDiscoPoPForHotspotDetection() +
                                        '/hotspot_detection/Hotspots.json',
                                }
                            )
                            await this.showHotspotDetectionResults()
                        } else {
                            console.error('HotspotDetection failed to run')
                        }
                    } catch (error) {
                        if (error instanceof UserCancellationError) {
                            error.showErrorMessageNotification()
                        } else {
                            throw error
                        }
                    }
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.runDiscoPoP,
                async (configuration: DiscoPoPRunCapableConfiguration) => {
                    try {
                        // DiscoPoP
                        this.dpResults?.dispose()
                        if (await configuration.runDiscoPoP()) {
                            this.dpResults = await DiscoPoPParser.parse({
                                dotDiscoPoP:
                                    configuration.getDotDiscoPoPForDiscoPoP(),
                            })
                            await this.showDiscoPoPResults()
                        } else {
                            console.error('DiscoPoP failed to run')
                        }
                    } catch (error) {
                        if (error instanceof UserCancellationError) {
                            error.showErrorMessageNotification()
                        } else {
                            throw error
                        }
                    }
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.addConfiguration,
                async () => {
                    // guide the user through the configuration creation process
                    this.configurationTreeDataProvider.createAndAddConfiguration()
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.runHotspotDetection,
                async (
                    configuration: HotspotDetectionRunCapableConfiguration
                ) => {
                    try {
                        // this.hsResults?.dispose() // TODO refactor to do this like with DiscoPoP ?
                        if (await configuration.runHotspotDetection()) {
                            this.hsResults = await HotspotDetectionParser.parse(
                                {
                                    filemappingPath:
                                        configuration.getDotDiscoPoPForHotspotDetection() +
                                        '/common_data/FileMapping.txt',
                                    hotspotsJsonPath:
                                        configuration.getDotDiscoPoPForHotspotDetection() +
                                        '/hotspot_detection/Hotspots.json',
                                }
                            )
                            await this.showHotspotDetectionResults()
                        } else {
                            console.error('HotspotDetection failed to run')
                        }
                    } catch (error) {
                        if (error instanceof UserCancellationError) {
                            error.showErrorMessageNotification()
                        } else {
                            throw error
                        }
                    }
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.loadResults,
                async (
                    configuration: DiscoPoPViewCapableConfiguration &
                        HotspotDetectionViewCapableConfiguration
                ) => {
                    // DiscoPoP
                    this.dpResults = await DiscoPoPParser.parse({
                        dotDiscoPoP: configuration.getDotDiscoPoPForDiscoPoP(),
                    })
                    await this.showDiscoPoPResults() // TODO move the above three lines into this function and pass required data

                    // HotspotDetection
                    this.hsResults = await HotspotDetectionParser.parse({
                        filemappingPath:
                            configuration.getDotDiscoPoPForHotspotDetection() +
                            '/common_data/FileMapping.txt',
                        hotspotsJsonPath:
                            configuration.getDotDiscoPoPForHotspotDetection() +
                            '/hotspot_detection/Hotspots.json',
                    })
                    await this.showHotspotDetectionResults() // TODO move the above 8 lines into the function and pass required data
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
                    this.hs_details.replaceContents(hotspot)
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
                    const dotDiscoPoP = this.dpResults?.dotDiscoPoP
                    this.codeLensProvider?.wait()
                    await PatchApplicator.clear(dotDiscoPoP).catch(ErrorHandler)
                }
            )
        )

        // used by codelenses
        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.applySuggestions,
                async (dotDiscoPoP: string, suggestions: Suggestion[]) => {
                    let suggestion: Suggestion | undefined = undefined
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

                    try {
                        this.codeLensProvider?.wait()
                        await PatchApplicator.applyPatch(
                            dotDiscoPoP,
                            suggestion.id
                        )
                    } catch (err) {
                        if (err instanceof Error) {
                            vscode.window.showErrorMessage(err.message)
                        } else {
                            vscode.window.showErrorMessage(
                                'Failed to apply suggestion.'
                            )
                        }
                        console.error('FAILED TO APPLY PATCH:')
                        console.error(err)
                        console.error(suggestion)
                    }

                    // TODO it would be nice to also show the suggestion as applied in the tree view
                    // --> themeIcon: record/pass

                    // TODO before inserting, preview the changes and request confirmation
                    // --> we could peek the patch file as a preview https://github.com/microsoft/vscode/blob/8434c86e5665341c753b00c10425a01db4fb8580/src/vs/editor/contrib/gotoSymbol/goToCommands.ts#L760
                    // --> we should also set the detail view to the suggestion that is being applied
                    // --> if hotspot results are available for the loop/function, we should also show them in the detail view
                }
            )
        )

        // used by tree view
        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.applySingleSuggestion,
                async (suggestionNode: DiscoPoPSuggestionNode) => {
                    this.codeLensProvider?.wait()
                    const suggestion = suggestionNode.suggestion
                    const dotDiscoPoP = this.dpResults.dotDiscoPoP
                    PatchApplicator.applyPatch(
                        dotDiscoPoP,
                        suggestion.id
                    ).catch(ErrorHandler)
                }
            )
        )

        // used by tree view
        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.rollbackSingleSuggestion,
                async (suggestionNode: DiscoPoPSuggestionNode) => {
                    const suggestion = suggestionNode.suggestion
                    const dotDiscoPoP = this.dpResults.dotDiscoPoP
                    this.codeLensProvider?.wait()
                    PatchApplicator.rollbackPatch(
                        dotDiscoPoP,
                        suggestion.id
                    ).catch(ErrorHandler)
                    // TODO also update the tree view
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

        // to allow undoing all suggestions, we need to get a hold on the .discopop directory
        // once we refactor to have more state in the extension, this is simple:
        // this.context.subscriptions.push(
        //     vscode.commands.registerCommand(
        //         Commands.rollbackAllSuggestions,
        //         async () => {

        //         }
        //     )
        // )
        // // package.json: (view/title)
        // {
        //     "command": "discopop.rollbackAllSuggestions",
        //     "when": "view == sidebar-suggestions-view",
        //     "group": "navigation"
        // }
    }

    public deactivate() {}
}
