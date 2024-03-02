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
        HotspotTreeViewCallbacks
{
    // extension
    private readonly discopopExtension: DiscopopExtension

    // configuration
    // TODO work on a better configuration management
    private readonly configurationManager: ConfigurationTreeDataProvider

    // views
    private readonly suggestionTreeView: SuggestionTreeView
    private readonly hotspotTreeView: HotspotTreeView
    private readonly suggestionDetailViewer: SuggestionDetailViewer
    private readonly hotspotDetailViewer: HotspotDetailViewer

    //
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
    }

    // ConfigurationManagerCallbacks
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

    // UI Callbacks
    uiUpdateSuggestions(suggestions: Map<string, CombinedSuggestion[]>): void {
        this.suggestionTreeView.combinedSuggestions = suggestions
    }
    uiUpdateHotspots(hotspots: Map<string, CombinedHotspot[]>): void {
        this.hotspotTreeView.combinedHotspots = hotspots
    }
    uiClearHotspots(): void {
        // TODO a clear function would be nicer, so that we show a pretty message
        this.hotspotTreeView.combinedHotspots = new Map<
            string,
            CombinedHotspot[]
        >()
    }
    uiClearSuggestions(): void {
        // TODO a clear function would be nicer, so that we show a pretty message
        this.suggestionTreeView.combinedSuggestions = new Map<
            string,
            CombinedSuggestion[]
        >()
    }
    uiShowShortNotification(message: string, durationInSeconds?: number): void {
        UIPrompts.showMessageForSeconds(message, durationInSeconds)
    }

    uiShowSingleSuggestion(suggestion: CombinedSuggestion): void {
        this.suggestionDetailViewer.replaceContents(suggestion.pureJSON)
        EditorSpotlight.hightlightSuggestion(suggestion)
    }
    uiShowSingleHotspot(hotspot: CombinedHotspot): void {
        this.hotspotDetailViewer.replaceContents(hotspot.pureJSON)
        EditorSpotlight.highlightHotspot(hotspot)
    }
}
