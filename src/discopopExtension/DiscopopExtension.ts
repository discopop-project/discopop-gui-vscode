import { CombinedDataDependency } from '../resultStore/CombinedDataDependency'
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
    uiUpdateDataDependencies(
        dataDependencies: Map<string, CombinedDataDependency[]>,
        projectPath: string
    ): void
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
        projectPath: string,
        discopopMissingOK: boolean = false,
        hotspotDetectionMissingOK: boolean = false,
        projectMissingOK: boolean = false,
        quietSuccess: boolean = false
    ): void {
        this.resultManager.updateAll(dotDiscopop, projectPath)

        // update the UI (if the results are invalid, the UI will be updated with empty data, which is fine)
        this.uiCallbacks.uiUpdateSuggestions(this.resultManager.suggestions)
        this.uiCallbacks.uiUpdateHotspots(this.resultManager.hotspots)
        this.uiCallbacks.uiUpdateDataDependencies(
            this.resultManager.dataDependencies,
            projectPath
        )

        // show a notification if the results are invalid

        const [suggestionsValid, hotspotsValid, dataDependenciesValid] = [
            this.resultManager.validSuggestions,
            this.resultManager.validHotspots,
            this.resultManager.validDataDependecies,
        ]

        // all three loaded
        if (suggestionsValid && hotspotsValid) {
            if (!quietSuccess) {
                this.uiCallbacks.uiShowShortNotification(
                    'Loaded hotspots and suggestions'
                )
            }

            return
        }

        // all three failed
        if (!suggestionsValid && !hotspotsValid && !dataDependenciesValid) {
            this.uiCallbacks.uiShowPersistentNotification(
                'Failed to load results: ' + this.resultManager.errorMessage,
                true
            )

            return
        }

        if (!suggestionsValid) {
            if (!discopopMissingOK) {
                this.uiCallbacks.uiShowPersistentNotification(
                    'No suggestions found: ' + this.resultManager.errorMessage,
                    true
                )
            } else {
                this.uiCallbacks.uiShowShortNotification('No suggestions found')
            }
        } else if (!quietSuccess) {
            this.uiCallbacks.uiShowShortNotification('Loaded suggestions')
        }

        if (!hotspotsValid) {
            if (!hotspotDetectionMissingOK) {
                this.uiCallbacks.uiShowPersistentNotification(
                    'No hotspots found: ' + this.resultManager.errorMessage,
                    true
                )
            } else {
                this.uiCallbacks.uiShowShortNotification('No hotspots found')
            }
        } else if (!quietSuccess) {
            this.uiCallbacks.uiShowShortNotification('Loaded hotspots')
        }

        if (!dataDependenciesValid) {
            if (!discopopMissingOK && !projectMissingOK) {
                this.uiCallbacks.uiShowPersistentNotification(
                    'No data dependencies found: ' +
                        this.resultManager.errorMessage,
                    true
                )
            } else {
                this.uiCallbacks.uiShowShortNotification(
                    'No data Dependencies found'
                )
            }
        } else if (!quietSuccess) {
            this.uiCallbacks.uiShowShortNotification('Loaded data dependencies')
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
        this.loadResults(
            this.resultManager.dotDiscopop,
            this.resultManager.projectpath,
            false,
            true,
            false,
            true
        )
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
        this.loadResults(
            this.resultManager.dotDiscopop,
            this.resultManager.projectpath,
            false,
            true,
            false,
            true
        )
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
        this.loadResults(
            this.resultManager.dotDiscopop,
            this.resultManager.projectpath,
            false,
            true,
            false,
            true
        )
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
        this.loadResults(
            this.resultManager.dotDiscopop,
            this.resultManager.projectpath,
            false,
            true,
            false,
            true
        )
    }
}
