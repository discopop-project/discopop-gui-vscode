import { CombinedHotspot } from '../resultStore/CombinedHotspot'
import { CombinedSuggestion } from '../resultStore/CombinedSuggestion'
import { ResultStore } from '../resultStore/ResultStore'
import { Settings } from '../settings/Settings'
import { ToolSuite } from '../toolSuite/ToolSuite'
import { CancelToken } from '../utils/cancellation/CancelToken'
import { WorkflowSuite } from '../workflowSuite/WorkflowSuite'

export interface DiscopopExtensionUICallbacks {
    uiUpdateSuggestions(suggestions: Map<string, CombinedSuggestion[]>): void
    uiUpdateHotspots(hotspots: Map<string, CombinedHotspot[]>): void
    uiShowShortNotification(message: string, durationInSeconds?: number): void
    uiRequestConfirmation(message: string): Promise<boolean>
}

export interface WorkflowWrappers {
    reportMessage: (message: string, nesting: number) => void
    reportProgress: (progress: number) => void
    requestConfirmation: (message: string) => Promise<boolean>
    cancelToken: CancelToken
}

export class DiscopopExtension {
    // TODO move it into a ResultManager, that also keeps track of file changes and updates accordingly
    private resultManager: ResultStore | undefined = undefined
    private toolSuite: ToolSuite = new ToolSuite()
    private workflowSuite: WorkflowSuite = new WorkflowSuite()

    public constructor(
        private uiCallbacks: DiscopopExtensionUICallbacks,
        private settings: Settings
    ) {}

    public loadResults(
        dotDiscopop: string,
        discopopMissingOK: boolean = false,
        hotspotDetectionMissingOK: boolean = false,
        quiet: boolean = false
    ): void {
        // read results
        if (!this.resultManager) {
            this.resultManager = new ResultStore(dotDiscopop)
        }
        this.resultManager.updateAll(dotDiscopop)

        // show suggestions
        this.uiCallbacks.uiUpdateSuggestions(this.resultManager.suggestions)
        if (this.resultManager.validSuggestions()) {
            if (!quiet) {
                this.uiCallbacks.uiShowShortNotification(
                    'DiscoPoP results loaded successfully'
                )
            }
        } else {
            if (!discopopMissingOK) {
                // also show in "quiet" mode
                // TODO we should provide more details (get a message from ResultStore, which can get them from the individual parsers)
                this.uiCallbacks.uiShowShortNotification(
                    'No valid DiscoPoP suggestions found'
                )
            }
        }

        // showHotspots
        this.uiCallbacks.uiUpdateHotspots(this.resultManager.hotspots)
        if (this.resultManager.validHotspots()) {
            if (!quiet) {
                this.uiCallbacks.uiShowShortNotification(
                    'HotspotDetection results loaded successfully'
                )
            }
        } else {
            // TODO we should provide more details (get a message from ResultStore, which can get them from the individual parsers)
            if (!hotspotDetectionMissingOK) {
                this.uiCallbacks.uiShowShortNotification(
                    'No valid HotspotDetection results found'
                )
            }
        }
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
            this.settings.skipConfirmation.overwriteBuild,
            projectPath,
            executableName,
            executableArgumentsForDiscoPoP,
            dotDiscoPoP,
            buildPathForDiscoPoP,
            buildArguments,
            overrideExplorerArguments
        )
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
            this.settings.skipConfirmation.overwriteBuild,
            projectPath,
            executableName,
            executableArgumentsForHotspotDetection,
            dotDiscopop,
            buildPathForHotspotDetection,
            buildArguments,
            overrideExplorerArguments
        )
    }

    public async runOptimizer(
        uiWrappers: WorkflowWrappers,
        dotDiscopop: string,
        overrideOptions?: string
    ): Promise<void> {
        await this.workflowSuite.optimizerWorkflow.run(
            uiWrappers.reportMessage,
            uiWrappers.reportProgress,
            uiWrappers.cancelToken,
            dotDiscopop,
            overrideOptions
        )
    }

    public async applySuggestion(
        suggestion: CombinedSuggestion
    ): Promise<void> {
        // are you sure?
        if (!this.settings.skipConfirmation.applyRollbackSuggestion) {
            const confirmed = await this.uiCallbacks.uiRequestConfirmation(
                `Do you want to apply the suggestion "${suggestion.patternID}"? This will modify your source code!`
            )
            if (!confirmed) {
                return
            }
        }

        // apply
        await this.toolSuite.discopopPatchApplicator.patchApply(
            this.resultManager.dotDiscopop,
            suggestion.patternID
        )

        // refresh results quietly (TODO only update the appliedStatus, not everything...)
        this.loadResults(this.resultManager.dotDiscopop, false, true, true)
    }

    public async rollbackSuggestion(
        suggestion: CombinedSuggestion
    ): Promise<void> {
        // are you sure?
        if (!this.settings.skipConfirmation.applyRollbackSuggestion) {
            const confirmed = await this.uiCallbacks.uiRequestConfirmation(
                `Do you want to rollback the suggestion "${suggestion.patternID}"? This will modify your source code!`
            )
            if (!confirmed) {
                return
            }
        }

        // rollback
        await this.toolSuite.discopopPatchApplicator.patchRollback(
            this.resultManager.dotDiscopop,
            suggestion.patternID
        )

        // refresh results quietly (TODO only update the appliedStatus, not everything...)
        this.loadResults(this.resultManager.dotDiscopop, false, true, true)
    }

    public async rollbackAllSuggestions(): Promise<void> {
        // are you sure?
        if (!this.settings.skipConfirmation.applyRollbackSuggestion) {
            const confirmed = await this.uiCallbacks.uiRequestConfirmation(
                `Do you want to rollback all applied suggestions? This will modify your source code!`
            )
            if (!confirmed) {
                return
            }
        }

        // rollback
        this.toolSuite.discopopPatchApplicator.patchClear(
            this.resultManager.dotDiscopop
        )

        // refresh results quietly (TODO only update the appliedStatus, not everything...)
        this.loadResults(this.resultManager.dotDiscopop, false, true, true)
    }

    public createInteractiveExport(): void {
        console.error('createInteractiveExport not implemented yet')
    }
}
