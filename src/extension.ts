import * as vscode from 'vscode'
import {
    ConfigurationManagerCallbacks,
    ConfigurationTreeDataProvider,
} from './configurationManager/ConfigurationTreeDataProvider'
import {
    DiscopopExtension,
    DiscopopExtensionUICallbacks,
    Settings,
    WorkflowWrappers,
} from './discopopExtension/DiscopopExtension'
import { CombinedHotspot } from './resultStore/CombinedHotspot'
import { CombinedSuggestion } from './resultStore/CombinedSuggestion'
import { UIPrompts } from './utils/UIPrompts'
import {
    getCancelTokenWrapper,
    getReportMessageWrapper,
    getReportProgressWrapper,
    getRequestConfirmationWrapper,
} from './utils/UIWrappers'
import {
    DiscoPoPCodeLensProvider,
    DiscoPoPCodeLensProviderCallbacks,
} from './views/DiscoPoPCodeLensProvider'
import { EditorSpotlight } from './views/EditorHighlighting'
import { HotspotDetailViewer } from './views/HotspotDetailViewer'
import { SuggestionDetailViewer } from './views/SuggestionDetailViewer'
import {
    HotspotTreeView,
    HotspotTreeViewCallbacks,
} from './views/hotspotTreeView/HotspotTreeView'
import {
    SuggestionTreeView,
    SuggestionTreeViewCallbacks,
} from './views/suggestionTreeView/SuggestionTreeView'

export function activate(context: vscode.ExtensionContext) {
    const uiExtension = new UIExtension(context)
}

export function deactivate() {}

export class UIExtension
    implements
        DiscopopExtensionUICallbacks,
        Settings,
        ConfigurationManagerCallbacks,
        SuggestionTreeViewCallbacks,
        HotspotTreeViewCallbacks,
        DiscoPoPCodeLensProviderCallbacks
{
    private readonly discopopExtension: DiscopopExtension
    private readonly configurationManager: ConfigurationTreeDataProvider
    private readonly suggestionTreeView: SuggestionTreeView
    private readonly hotspotTreeView: HotspotTreeView
    private readonly suggestionDetailViewer: SuggestionDetailViewer
    private readonly hotspotDetailViewer: HotspotDetailViewer
    private readonly codeLensManager: DiscoPoPCodeLensProvider

    public constructor(private context: vscode.ExtensionContext) {
        this.discopopExtension = new DiscopopExtension(this, this)

        // configuration management
        // TODO this should be part of the Extension and we would only have views here
        this.configurationManager = new ConfigurationTreeDataProvider(
            this.context,
            this
        )

        // views
        this.suggestionDetailViewer = new SuggestionDetailViewer(
            undefined,
            this.context
        )
        this.hotspotDetailViewer = new HotspotDetailViewer(
            undefined,
            this.context
        )
        this.suggestionTreeView = new SuggestionTreeView(this.context, this)
        this.hotspotTreeView = new HotspotTreeView(this.context, this)

        // code lenses
        this.codeLensManager = DiscoPoPCodeLensProvider.create(
            this.context,
            this
        )
    }

    /**
     * can be called by UI componenets to trigger the loading of results
     * @param dotDiscopop the path to the .discopop directory where the results are stored
     * @param suggestionsMissingOK if true, do not show a message if loading of suggestions fails (e.g. when only hotspots should be loaded)
     * @param hotspotsMissingOK if true, do not show a message if loading of hotspots fails (e.g. when only suggestions should be loaded)
     * @param quiet if true: only show errors, no success messages
     * */
    loadResults(
        dotDiscopop: string,
        suggestionsMissingOK: boolean = false,
        hotspotsMissingOK: boolean = false,
        quiet: boolean = false
    ): void {
        this.discopopExtension.loadResults(
            dotDiscopop,
            suggestionsMissingOK,
            hotspotsMissingOK,
            quiet
        )
    }

    /** can be called by UI components to trigger a hotspot detection run */
    async runHotspotDetection(
        projectPath: string,
        executableName: string,
        executableArgumentsForHotspotDetection: string[],
        dotDiscopop: string,
        buildPathForHotspotDetection: string,
        buildArguments: string,
        overrideHotspotDetectionArguments?: string
    ): Promise<void> {
        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Running HotspotDetection',
                cancellable: true,
            },
            async (progress, token) => {
                const uiWrappers: WorkflowWrappers = {
                    reportMessage: getReportMessageWrapper(
                        'HotspotDetection: ',
                        progress
                    ),
                    reportProgress: getReportProgressWrapper(progress),
                    requestConfirmation: getRequestConfirmationWrapper(),
                    cancelToken: getCancelTokenWrapper(token),
                }
                await this.discopopExtension.runHotspotDetection(
                    uiWrappers,
                    projectPath,
                    executableName,
                    executableArgumentsForHotspotDetection,
                    dotDiscopop,
                    buildPathForHotspotDetection,
                    buildArguments,
                    overrideHotspotDetectionArguments
                )
            }
        )
    }

    /** can be called by UI components to trigger a DiscoPoP run */
    async runDiscoPoP(
        projectPath: string,
        executableName: string,
        executableArgumentsForDiscoPoP: string,
        dotDiscoPoP: string,
        buildPathForDiscoPoP: string,
        buildArguments: string,
        overrideExplorerArguments?: string
    ): Promise<void> {
        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Running DiscoPoP',
                cancellable: true,
            },
            async (progress, token) => {
                const uiWrappers: WorkflowWrappers = {
                    reportMessage: getReportMessageWrapper(
                        'DiscoPoP: ',
                        progress
                    ),
                    reportProgress: getReportProgressWrapper(progress),
                    requestConfirmation: getRequestConfirmationWrapper(),
                    cancelToken: getCancelTokenWrapper(token),
                }
                await this.discopopExtension.runDiscoPoP(
                    uiWrappers,
                    projectPath,
                    executableName,
                    executableArgumentsForDiscoPoP,
                    dotDiscoPoP,
                    buildPathForDiscoPoP,
                    buildArguments,
                    overrideExplorerArguments
                )
            }
        )
    }

    // TODO connect this to the actual settings
    private _temporaryGlobalCodeLensSetting: boolean = true
    public getGlobalCodeLensSetting(): boolean {
        return this._temporaryGlobalCodeLensSetting
    }
    public toggleGlobalCodeLensSetting() {
        this._temporaryGlobalCodeLensSetting =
            !this._temporaryGlobalCodeLensSetting
    }

    // Methods to update the UI
    public uiUpdateSuggestions(
        suggestions: Map<string, CombinedSuggestion[]>
    ): void {
        this.suggestionTreeView.combinedSuggestions = suggestions
        this.codeLensManager.combinedSuggestions = suggestions
    }
    public uiUpdateHotspots(hotspots: Map<string, CombinedHotspot[]>): void {
        this.hotspotTreeView.combinedHotspots = hotspots
    }
    public uiClearHotspots(): void {
        this.hotspotTreeView.combinedHotspots = new Map<
            string,
            CombinedHotspot[]
        >()
    }
    public uiClearSuggestions(): void {
        this.suggestionTreeView.combinedSuggestions = new Map<
            string,
            CombinedSuggestion[]
        >()
    }
    public uiShowShortNotification(
        message: string,
        durationInSeconds?: number
    ): void {
        UIPrompts.showMessageForSeconds(message, durationInSeconds)
    }

    public uiShowSingleSuggestion(suggestion: CombinedSuggestion): void {
        this.suggestionDetailViewer.replaceContents(suggestion.pureJSON)
        EditorSpotlight.hightlightSuggestion(suggestion)
    }
    public uiShowSingleHotspot(hotspot: CombinedHotspot): void {
        this.hotspotDetailViewer.replaceContents(hotspot.pureJSON)
        EditorSpotlight.highlightHotspot(hotspot)
    }
}
