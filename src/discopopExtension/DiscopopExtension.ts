import { CombinedHotspot } from '../dpResults/CombinedHotspot'
import { CombinedSuggestion } from '../dpResults/CombinedSuggestion'
import { ResultManager } from '../dpResults/ResultManager'
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

export class DiscopopExtension {
    // TODO move it into a ResultManager, that also keeps track of file changes and updates accordingly
    private resultManager: ResultManager | undefined = undefined
    private toolSuite: ToolSuite = new ToolSuite()
    private workflowSuite: WorkflowSuite = new WorkflowSuite()

    public constructor(
        private uiCallbacks: DiscopopExtensionUICallbacks,
        private settings: Settings
    ) {}

    public loadResults(dotDiscopop: string): void {
        this.resultManager = new ResultManager(dotDiscopop)
        if (this.resultManager.validSuggestions()) {
            this.uiCallbacks.uiShowAllSuggestions(
                this.resultManager.suggestions
            )
        } else {
            // TODO we should provide more details (get them from ResultManager, who can get them from the individual parsers)
            this.uiCallbacks.uiShowShortNotification(
                'No valid DiscoPoP suggestions found'
            )
        }
        if (this.resultManager.validHotspots()) {
            this.uiCallbacks.uiShowAllHotspots(this.resultManager.hotspots)
        } else {
            // TODO we should provide more details (get them from ResultManager, who can get them from the individual parsers)
            this.uiCallbacks.uiShowShortNotification(
                'No valid HotspotDetection results found'
            )
        }
    }

    public runDiscoPoP(
        uiWrappers: WorkflowWrappers,
        projectPath: string,
        executableName: string,
        executableArgumentsForDiscoPoP: string,
        dotDiscoPoP: string,
        buildPathForDiscoPoP: string,
        buildArguments: string,
        overrideExplorerArguments?: string
    ): void {
        this.workflowSuite.discopopWorkflow.run(
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

        this.loadResults(dotDiscoPoP)
    }

    public runHotspotDetection(
        uiWrappers: WorkflowWrappers,
        projectPath: string,
        executableName: string,
        executableArgumentsForHotspotDetection: string[],
        dotDiscopop: string,
        buildPathForHotspotDetection: string,
        buildArguments: string,
        overrideExplorerArguments?: string
    ): void {
        this.workflowSuite.hotspotDetectionWorkflow.run(
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

        this.loadResults(dotDiscopop)
    }
}
