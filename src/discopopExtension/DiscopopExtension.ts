import { CombinedHotspot } from '../resultStore/CombinedHotspot'
import { CombinedSuggestion } from '../resultStore/CombinedSuggestion'
import {
    ResultManager,
    ResultManagerImplementation,
} from '../resultStore/ResultManager'
import { Settings } from '../settings/Settings'
import { ToolSuite } from '../toolSuite/ToolSuite'
import { CancelToken } from '../utils/cancellation/CancelToken'
import { WorkflowSuite } from '../workflowSuite/WorkflowSuite'

export interface DiscopopExtensionUICallbacks {
    uiUpdateSuggestions(suggestions: Map<string, CombinedSuggestion[]>): void
    uiUpdateHotspots(hotspots: Map<string, CombinedHotspot[]>): void
    uiRequestConfirmation(message: string): Promise<boolean>
    uiShowShortNotification(message: string, durationInSeconds?: number): void
    uiShowPersistentNotification(message: string, isError?: boolean): void
}

export interface WorkflowWrappers {
    reportMessage: (message: string, nesting: number) => void
    reportProgress: (progress: number) => void
    requestConfirmation: (message: string) => Promise<boolean>
    cancelToken: CancelToken
}

export class DiscopopExtension {
    private workflowSuite: WorkflowSuite = new WorkflowSuite()
    private resultManager: ResultManager = new ResultManagerImplementation()
    public constructor(
        private settings: Settings,
        private uiCallbacks: DiscopopExtensionUICallbacks
    ) {}

    public loadResults(
        dotDiscopop: string,
        discopopMissingOK: boolean = false,
        hotspotDetectionMissingOK: boolean = false,
        quietSuccess: boolean = false
    ): void {
        this.resultManager.updateAll(dotDiscopop)

        // update the UI (if the results are invalid, the UI will be updated with empty data, which is fine)
        this.uiCallbacks.uiUpdateSuggestions(this.resultManager.suggestions)
        this.uiCallbacks.uiUpdateHotspots(this.resultManager.hotspots)

        // show a notification if the results are invalid

        const [suggestionsValid, hotspotsValid] = [
            this.resultManager.validSuggestions,
            this.resultManager.validHotspots,
        ]
        // both loaded
        if (suggestionsValid && hotspotsValid) {
            if (!quietSuccess) {
                this.uiCallbacks.uiShowShortNotification(
                    'Loaded hotspots and suggestions'
                )
            }
        }
        // both failed
        else if (!suggestionsValid && !hotspotsValid) {
            this.uiCallbacks.uiShowPersistentNotification(
                'Failed to load results: ' + this.resultManager.errorMessage,
                true
            )
        }
        // hotspots loaded, no suggestions
        else if (!suggestionsValid) {
            if (!quietSuccess) {
                this.uiCallbacks.uiShowShortNotification('Loaded hotspots')
            }
            if (!discopopMissingOK) {
                this.uiCallbacks.uiShowPersistentNotification(
                    'No suggestions found: ' + this.resultManager.errorMessage,
                    true
                )
            } else {
                this.uiCallbacks.uiShowShortNotification('No suggestions found')
            }
        }
        // suggestions loaded, no hotspots
        else if (!hotspotsValid) {
            if (!quietSuccess) {
                this.uiCallbacks.uiShowShortNotification('Loaded suggestions')
            }
            if (!hotspotDetectionMissingOK) {
                this.uiCallbacks.uiShowPersistentNotification(
                    'No hotspots found: ' + this.resultManager.errorMessage,
                    true
                )
            } else {
                this.uiCallbacks.uiShowShortNotification('No hotspots found')
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
        await ToolSuite.discopopPatchApplicator.patchApply(
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
        await ToolSuite.discopopPatchApplicator.patchRollback(
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
        await ToolSuite.discopopPatchApplicator.patchClear(
            this.resultManager.dotDiscopop
        )

        // refresh results quietly (TODO only update the appliedStatus, not everything...)
        this.loadResults(this.resultManager.dotDiscopop, false, true, true)
    }

    public async createInteractiveExport(): Promise<void> {
        // TODO create a pretty notification /workflow
        const idList = []
        for (const suggestion of this.resultManager.suggestions.values()) {
            for (const combinedSuggestion of suggestion) {
                if (combinedSuggestion.markedForExport) {
                    idList.push(combinedSuggestion.patternID)
                }
            }
        }
        await ToolSuite.discopopOptimizer.run(this.resultManager.dotDiscopop, {
            interactiveExport: idList,
        })

        await ToolSuite.discopopPatchGenerator.createOptimizedPatches(
            this.resultManager.dotDiscopop
        )

        // refresh results quietly (TODO only update the appliedStatus, not everything...)
        this.loadResults(this.resultManager.dotDiscopop, false, true, true)
    }
}
