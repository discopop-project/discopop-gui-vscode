import { ResultManager, ResultManagerCallbacks } from '../results/ResultManager'
import { CombinedHotspot } from '../results/resultStore/CombinedHotspot'
import { CombinedSuggestion } from '../results/resultStore/CombinedSuggestion'
import { ToolSuite } from '../toolSuite/ToolSuite'
import { CancelToken } from '../utils/cancellation/CancelToken'
import { WorkflowSuite } from '../workflowSuite/WorkflowSuite'

export interface DiscopopExtensionUICallbacks {
    // TODO updateConfigurations(...): void
    uiShowAllSuggestions(suggestions: Map<string, CombinedSuggestion[]>): void
    uiShowAllHotspots(hotspots: Map<string, CombinedHotspot[]>): void
    uiShowShortNotification(message: string, durationInSeconds?: number): void
}

export interface Settings {
    // TODO
}

export interface WorkflowWrappers {
    reportMessage: (message: string, nesting: number) => void
    reportProgress: (progress: number) => void
    requestConfirmation: (message: string) => Promise<boolean>
    cancelToken: CancelToken
}

export class DiscopopExtension implements ResultManagerCallbacks {
    // TODO move it into a ResultManager, that also keeps track of file changes and updates accordingly
    private resultManager: ResultManager | undefined = undefined
    private toolSuite: ToolSuite = new ToolSuite()
    private workflowSuite: WorkflowSuite = new WorkflowSuite()

    public constructor(
        private uiCallbacks: DiscopopExtensionUICallbacks,
        private settings: Settings
    ) {}

    public loadResults(
        dotDiscopop: string,
        discopopMissingOK: boolean = false,
        hotspotDetectionMissingOK: boolean = false
    ): void {
        if (!this.resultManager) {
            this.resultManager = new ResultManager(dotDiscopop, this)
        }
        this.resultManager.update(dotDiscopop)
        if (this.resultManager.validSuggestions()) {
            this.uiCallbacks.uiShowAllSuggestions(
                this.resultManager.suggestions
            )
            this.uiCallbacks.uiShowShortNotification(
                'DiscoPoP results loaded successfully'
            )
        } else {
            // TODO we should provide more details (get them from ResultManager, who can get them from the individual parsers)
            if (!discopopMissingOK) {
                this.uiCallbacks.uiShowShortNotification(
                    'No valid DiscoPoP suggestions found'
                )
            }
        }
        if (this.resultManager.validHotspots()) {
            this.uiCallbacks.uiShowAllHotspots(this.resultManager.hotspots)
            this.uiCallbacks.uiShowShortNotification(
                'HotspotDetection results loaded successfully'
            )
        } else {
            // TODO we should provide more details (get them from ResultManager, who can get them from the individual parsers)
            if (!hotspotDetectionMissingOK) {
                this.uiCallbacks.uiShowShortNotification(
                    'No valid HotspotDetection results found'
                )
            }
        }
    }

    public onResultsLoaded(): void {
        console.log('onResultsLoaded')
    }

    public async runDiscoPoP(
        uiWrappers: WorkflowWrappers,
        projectPath: string,
        executableName: string,
        executableArgumentsForDiscoPoP: string,
        dotDiscoPoP: string,
        buildPathForDiscoPoP: string,
        buildArguments: string,
        overrideExplorerArguments?: string
    ): Promise<void> {
        await this.workflowSuite.discopopWorkflow.run(
            uiWrappers.reportMessage,
            uiWrappers.reportProgress,
            uiWrappers.requestConfirmation,
            uiWrappers.cancelToken,
            projectPath,
            executableName,
            executableArgumentsForDiscoPoP,
            dotDiscoPoP,
            buildPathForDiscoPoP,
            buildArguments,
            overrideExplorerArguments
        )

        this.loadResults(dotDiscoPoP, false, true)
    }

    public async runHotspotDetection(
        uiWrappers: WorkflowWrappers,
        projectPath: string,
        executableName: string,
        executableArgumentsForHotspotDetection: string[],
        dotDiscopop: string,
        buildPathForHotspotDetection: string,
        buildArguments: string,
        overrideExplorerArguments?: string
    ): Promise<void> {
        await this.workflowSuite.hotspotDetectionWorkflow.run(
            uiWrappers.reportMessage,
            uiWrappers.reportProgress,
            uiWrappers.requestConfirmation,
            uiWrappers.cancelToken,
            projectPath,
            executableName,
            executableArgumentsForHotspotDetection,
            dotDiscopop,
            buildPathForHotspotDetection,
            buildArguments,
            overrideExplorerArguments
        )

        this.loadResults(dotDiscopop, true, false)
    }
}
