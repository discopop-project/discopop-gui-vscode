import * as vscode from 'vscode'
import { ProjectManager } from './ProjectManager/ProjectManager'
import { DiscoPoPDetailViewProvider } from './DiscoPoP/DiscoPoPDetailViewProvider'
import { HotspotDetailViewProvider } from './HotspotDetection/HotspotDetailViewProvider'
import { Commands } from './Utils/Commands'
import { DiscoPoPCodeLensProvider } from './DiscoPoP/DiscoPoPCodeLensProvider'
import {
    DiscoPoPSuggestionNode,
    SuggestionTree,
} from './DiscoPoP/DiscoPoPSuggestionTree'
import { PatchManager } from './DiscoPoP/PatchManager'
import { Suggestion } from './DiscoPoP/classes/Suggestion/Suggestion'
import { FileMapping } from './FileMapping/FileMapping'
import { HotspotTree } from './HotspotDetection/HotspotTree'
import { Hotspot } from './HotspotDetection/classes/Hotspot'
import {
    Configuration,
    DefaultConfiguration,
} from './ProjectManager/Configuration'
import { Decoration } from './Utils/Decorations'
import {
    DiscoPoPRunner,
    DiscoPoPRunnerResults,
} from './DiscoPoP/DiscoPoPRunner'
import {
    HotspotDetectionRunner,
    HotspotDetectionRunnerResults,
} from './HotspotDetection/HotspotDetectionRunner'
import { getDefaultErrorHandler } from './Utils/ErrorHandler'

function _removeDecorations(
    editor: vscode.TextEditor,
    ...decorations: vscode.TextEditorDecorationType[]
) {
    decorations.forEach((decoration) => {
        editor.setDecorations(decoration, [])
    })
}

export class DiscoPoPExtension {
    private projectManager: ProjectManager
    private dp_details: DiscoPoPDetailViewProvider =
        new DiscoPoPDetailViewProvider(undefined)
    private hs_details: HotspotDetailViewProvider =
        new HotspotDetailViewProvider(undefined)

    // TODO I would like to keep the disposables inside the respective classes
    // const suggestionTree = new ...
    // const hotspotTree = new ...
    // const dp_codelensProvider = new DiscoPoPCodeLensProvider(undefined, undefined, undefined, undefined)
    private hotspotTreeDisposable: vscode.Disposable | undefined = undefined
    private suggestionTreeDisposable: vscode.Disposable | undefined = undefined
    private codeLensProviderDisposable: vscode.Disposable | undefined =
        undefined

    public constructor(private context: vscode.ExtensionContext) {
        this.projectManager = new ProjectManager(context)
    }

    public async showDiscoPoPResults(
        dpResults: DiscoPoPRunnerResults,
        fullConfig: DefaultConfiguration
    ) {
        // show the suggestions in the sidebar
        const suggestionTree = new SuggestionTree(
            fullConfig,
            dpResults.fileMapping,
            dpResults.discoPoPResults
        ) // TODO use lineMapping here
        await this.suggestionTreeDisposable?.dispose()
        this.suggestionTreeDisposable = vscode.window.createTreeView(
            'sidebar-suggestions-view',
            {
                treeDataProvider: suggestionTree,
                showCollapseAll: false,
                canSelectMany: false,
            }
        )

        // enable code lenses for all suggestions
        // TODO we should not create a new code lens provider every time,
        const codeLensProvider = new DiscoPoPCodeLensProvider(
            dpResults.fileMapping,
            dpResults.lineMapping,
            fullConfig,
            dpResults.discoPoPResults.getAllSuggestions()
        )
        await this.codeLensProviderDisposable?.dispose()
        this.codeLensProviderDisposable =
            vscode.languages.registerCodeLensProvider(
                { scheme: 'file', language: 'cpp' }, // TODO only apply this provider for files listed in the fileMapping
                codeLensProvider
            )
    }

    public async showHotspotDetectionResults(
        hsResults: HotspotDetectionRunnerResults
    ) {
        // show the hotspots in the sidebar
        const hotspotTree = new HotspotTree(
            hsResults.fileMapping,
            undefined, // TODO s.lineMapping,
            hsResults.hotspotDetectionResults
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
        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.runDiscoPoPAndHotspotDetection,
                async (configuration: Configuration) => {
                    const fullConfig = configuration.getFullConfiguration()

                    // DiscoPoP
                    const dpResults = await fullConfig.runDiscoPoP()
                    await this.showDiscoPoPResults(dpResults, fullConfig)

                    // HotspotDetection
                    const hsResults = await configuration.runHotspotDetection()
                    await this.showHotspotDetectionResults(hsResults)
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.runDiscoPoP,
                async (configuration: Configuration) => {
                    const fullConfig = configuration.getFullConfiguration()
                    const results = await fullConfig.runDiscoPoP()
                    this.showDiscoPoPResults(results, fullConfig)
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.runHotspotDetection,
                async (configuration: Configuration) => {
                    const results = await configuration.runHotspotDetection()
                    this.showHotspotDetectionResults(results)
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.loadDiscoPoPResults,
                async (configuration: Configuration) => {
                    const fullConfig = configuration.getFullConfiguration()
                    const results = await DiscoPoPRunner.parse({
                        fullConfiguration: fullConfig,
                    })
                    this.showDiscoPoPResults(results, fullConfig)
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.loadHotspotResults,
                async (configuration: Configuration) => {
                    const fullConfig = configuration.getFullConfiguration()
                    const results = await HotspotDetectionRunner.parse({
                        configuration: fullConfig,
                    })
                    this.showHotspotDetectionResults(results)
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.showSuggestionDetails,
                async (suggestion: Suggestion, fileMapping: FileMapping) => {
                    this.dp_details.replaceContents(suggestion.pureJSONData)
                    const filePath = fileMapping.getFilePath(suggestion.fileId)
                    const document = await vscode.workspace.openTextDocument(
                        filePath
                    )
                    const editor = await vscode.window.showTextDocument(
                        document,
                        vscode.ViewColumn.Active,
                        false
                    )
                    const line = new vscode.Position(
                        suggestion.startLine - 1,
                        0
                    )
                    editor.selections = [new vscode.Selection(line, line)]
                    const startLineRange = new vscode.Range(line, line)
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
                        new vscode.Position(suggestion.startLine - 1, 0),
                        new vscode.Position(suggestion.endLine - 1, 0)
                    )
                    editor.setDecorations(Decoration.SOFT, [
                        { range: entireRange },
                    ])
                }
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
                    const line = new vscode.Position(hotspot.lineNum - 1, 0)
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

        // used by codelenses
        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.applySuggestions,
                async (
                    fullConfiguration: DefaultConfiguration,
                    suggestions: Suggestion[]
                ) => {
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
                        await PatchManager.applyPatch(
                            fullConfiguration.getDiscoPoPBuildDirectory() +
                                '/.discopop',
                            suggestion.id
                        )
                        suggestion.applied = true // TODO this should be handled by the PatchManager
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
                        console.error(fullConfiguration)
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

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.applySingleSuggestion,
                async (suggestionNode: DiscoPoPSuggestionNode) => {
                    const suggestion = suggestionNode.suggestion
                    const dotDiscoPoP =
                        suggestionNode.fullConfig.getDiscoPoPBuildDirectory() +
                        '/.discopop'
                    suggestion.applied = true // TODO this should be handled by the PatchManager
                    PatchManager.applyPatch(dotDiscoPoP, suggestion.id).catch(
                        getDefaultErrorHandler('Failed to apply suggestion')
                    )
                    // TODO also update the tree view
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.rollbackSingleSuggestion,
                async (suggestionNode: DiscoPoPSuggestionNode) => {
                    const suggestion = suggestionNode.suggestion
                    const dotDiscoPoP =
                        suggestionNode.fullConfig.getDiscoPoPBuildDirectory() +
                        '/.discopop'
                    suggestion.applied = false // TODO this should be handled by the PatchManager
                    PatchManager.rollbackPatch(
                        dotDiscoPoP,
                        suggestion.id
                    ).catch(
                        getDefaultErrorHandler('Failed to rollback suggestion')
                    )
                    // TODO also update the tree view
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
