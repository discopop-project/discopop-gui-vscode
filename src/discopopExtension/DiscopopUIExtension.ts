import * as vscode from 'vscode'
import {
    ConfigurationManagerCallbacks,
    ConfigurationTreeDataProvider,
} from '../configurationManager/ConfigurationTreeDataProvider'
import { CombinedHotspot } from '../results/combinedResults/CombinedHotspot'
import { CombinedSuggestion } from '../results/combinedResults/CombinedSuggestion'
import { UIPrompts } from '../utils/UIPrompts'
import {
    getCancelTokenWrapper,
    getReportMessageWrapper,
    getReportProgressWrapper,
    getRequestConfirmationWrapper,
} from '../utils/UIWrappers'
import {
    HotspotTreeView,
    HotspotTreeViewCallbacks,
} from '../views/hotspotTreeView/HotspotTreeView'
import {
    SuggestionTreeView,
    SuggestionTreeViewCallbacks,
} from '../views/suggestionTreeView/SuggestionTreeView'
import {
    DiscopopExtension,
    DiscopopExtensionUICallbacks,
    Settings,
    WorkflowWrappers,
} from './DiscopopExtension'
import { HotspotDetailViewer } from './HotspotDetailViewer'
import { SuggestionDetailViewer } from './SuggestionDetailViewer'

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
    loadResults(dotDiscopop: string): void {
        this.discopopExtension.loadResults(dotDiscopop)
    }

    runHotspotDetection(
        projectPath: string,
        executableName: string,
        executableArgumentsForHotspotDetection: string[],
        dotDiscopop: string,
        buildPathForHotspotDetection: string,
        buildArguments: string,
        overrideHotspotDetectionArguments?: string
    ): void {
        vscode.window.withProgress(
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
                this.discopopExtension.runHotspotDetection(
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

    runDiscoPoP(
        projectPath: string,
        executableName: string,
        executableArgumentsForDiscoPoP: string,
        dotDiscoPoP: string,
        buildPathForDiscoPoP: string,
        buildArguments: string,
        overrideExplorerArguments?: string
    ): void {
        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Running HotspotDetection',
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
                this.discopopExtension.runDiscoPoP(
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
    uiShowSingleSuggestion(suggestion: CombinedSuggestion): void {
        this.suggestionDetailViewer.replaceContents(suggestion.pureJSON)
        // TODO highlight it in the editor
    }
    uiShowSingleHotspot(hotspot: CombinedHotspot): void {
        this.hotspotDetailViewer.replaceContents(hotspot.pureJSON)
        // TODO highlight it in the editor
    }
    uiShowAllSuggestions(suggestions: Map<string, CombinedSuggestion[]>): void {
        this.suggestionTreeView.combinedSuggestions = suggestions
    }
    uiShowAllHotspots(hotspots: Map<string, CombinedHotspot[]>): void {
        this.hotspotTreeView.combinedHotspots = hotspots
    }
    uiShowShortNotification(message: string, durationInSeconds?: number): void {
        UIPrompts.showMessageForSeconds(message, durationInSeconds)
    }
}
