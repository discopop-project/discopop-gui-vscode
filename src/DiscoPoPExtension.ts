import * as vscode from 'vscode'
import {
    ConfigurationManagerCallbacks,
    ConfigurationTreeDataProvider,
} from './configurationManager/ConfigurationTreeDataProvider'
import { CombinedResults } from './dpResults/combinedResults/CombinedResults'
import {
    getCancelTokenWrapper,
    getReportMessageWrapper,
    getReportProgressWrapper,
    getRequestConfirmationWrapper,
} from './discopop/runners/workflows/UIWrappers'
import { HotspotDetectionResults } from './discopop/model/HotspotDetectionResults'
import { HotspotDetectionCMakeWorkflow } from './discopop/runners/workflows/HotspotDetectionCMakeWorkflow'
import { UIPrompts } from './utils/UIPrompts'

interface SuggestionManagerCallbacks {
    showSuggestionDetails(suggestionID: number): void
    applySuggestion(suggestionID: number): void // TODO or should the suggestionmanager do this itself??
    rollbackSuggestion(suggestionID: number): void
    rollbackAllSuggestions(): void
} // TODO move

// TODO duplicate code
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

export class DiscoPoPExtension
    implements ConfigurationManagerCallbacks, SuggestionManagerCallbacks
{
    private readonly configurationTreeDataProvider: ConfigurationTreeDataProvider
    // private readonly suggestionTreeDataProvider: SuggestionTreeDataProvider; // TODO

    private combinedResults: CombinedResults | undefined = undefined
    // private resultWatcher: ResultWatcher|undefined = undefined; TODO

    public constructor(private readonly context: vscode.ExtensionContext) {
        // TODO the tree should register its most relevant commands itself and communicate with us using events or callbacks
        this.configurationTreeDataProvider = new ConfigurationTreeDataProvider(
            this.context,
            this
        )
        this.context.subscriptions.push(
            vscode.window.registerTreeDataProvider(
                'sidebar-projects-view',
                this.configurationTreeDataProvider
            )
        )
    }

    // SuggestionManagerCallbacks
    showSuggestionDetails(suggestionID: number): void {
        throw new Error('Method not implemented.')
    }
    applySuggestion(suggestionID: number): void {
        throw new Error('Method not implemented.')
    }
    rollbackSuggestion(suggestionID: number): void {
        throw new Error('Method not implemented.')
    }
    rollbackAllSuggestions(): void {
        throw new Error('Method not implemented.')
    }

    // ConfigurationManagerCallbacks
    loadResults(dotDiscopop: string): void {
        this.combinedResults = new CombinedResults(dotDiscopop)
        console.log(this.combinedResults)
        // TODO show them in a treeView
    }
    async runDiscoPoP(dotDiscopop: string): Promise<void> {
        throw new Error('Method not implemented.')
    }
    async runHotspotDetection(
        projectPath: string,
        executableName: string,
        executableArgumentsForHotspotDetection: string[],
        dotDiscoPoP: string,
        buildPathForHotspotDetection: string,
        buildArguments: string,
        overrideHotspotArguments?: string
    ): Promise<void> {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Running HotspotDetection',
                cancellable: true,
            },
            async (progress, token) => {
                const hsRunner = new HotspotDetectionCMakeWorkflow(
                    projectPath,
                    executableName,
                    executableArgumentsForHotspotDetection,
                    dotDiscoPoP,
                    buildPathForHotspotDetection,
                    buildArguments,
                    overrideHotspotArguments
                )
                await hsRunner.run(
                    getReportMessageWrapper('HotspotDetection: ', progress),
                    getReportProgressWrapper(progress),
                    getRequestConfirmationWrapper(),
                    getCancelTokenWrapper(token)
                )
            }
        )
    }
}
