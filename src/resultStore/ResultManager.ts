import { AppliedStatus } from '../pureResults/AppliedStatus'
import { FileMapping } from '../pureResults/FileMapping'
import { Hotspots } from '../pureResults/Hotspots'
import { LineMapping } from '../pureResults/LineMapping'
import { Suggestions } from '../pureResults/Suggestions'
import { CombinedHotspot } from './CombinedHotspot'
import { CombinedSuggestion } from './CombinedSuggestion'

/**
 * The ResultManager is responsible for managing the results of the discoPoP analysis.
 * It reads the results from the .discopop directory and provides them in a more accessible format by combining the results from the different files.
 * It also provides means to update the results, in case the user wants to re-read the results from the .discopop directory.
 * Basic Usage:
 *  - create a new ResultManager
 *  - call updateAll() and provide the path to a .discopop directory to read the results
 *  - use the validSuggestions() and validHotspots() methods to check if the results have been read successfully
 *  - if they are valid: use the suggestions and hotspots maps to access the results
 *  - calling any of the update methods will re-read the results from the .discopop directory, updating the provided maps
 */
export interface ResultManager {
    /**
     * returns true if the discoPoP results have all been parsed successfully.
     */
    validSuggestions: boolean

    /**
     * returns true if the hotspot detection results have all been parsed successfully.
     */
    validHotspots: boolean

    /** if validSuggestions() or validHotspots returns false:  */
    errorMessage: string | null

    /** the path to the used .discopop directory */
    dotDiscopop: string

    /** a map containing all the combined suggestions, grouped by their type */
    suggestions: Map<string, CombinedSuggestion[]>

    /** a map containing all the hotspots, grouped by hotness (YES,NO,MAYBE) */
    hotspots: Map<string, CombinedHotspot[]>

    /** reread all files, you can also specify to use a different .discopop directory */
    updateAll(dotDiscopop?: string)

    /** reread the patterns.json */
    updateSuggestions(): void

    /** reread the Hotspots.json */
    updateHotspots(): void

    /** reread the FileMapping.txt */
    updateFileMapping(): void

    /** reread the line_mapping.json */
    updateLineMapping(): void

    /** reread the applied_suggestions.json */
    updateAppliedStatus(): void
}

export class ResultManagerImplementation implements ResultManager {
    private readonly _fileMapping: FileMapping
    private readonly _lineMapping: LineMapping
    private readonly _appliedStatus: AppliedStatus
    private readonly _suggestions: Suggestions
    private readonly _hotspots: Hotspots

    public constructor(private _dotDiscopop?: string) {
        this._suggestions = new Suggestions(_dotDiscopop)
        this._hotspots = new Hotspots(_dotDiscopop)
        this._fileMapping = new FileMapping(_dotDiscopop)
        this._lineMapping = new LineMapping(_dotDiscopop)
        this._appliedStatus = new AppliedStatus(_dotDiscopop)
        if (this.validSuggestions) {
            this._recomputeCombinedSuggestions()
        }
        if (this.validHotspots) {
            this._recomputeCombinedHotspots()
        }
    }

    public get errorMessage(): string | null {
        let errorMessage = ''
        if (!this._fileMapping.valid()) {
            errorMessage += `FileMapping invalid: ${this._fileMapping.error} \n`
        }
        if (!this._lineMapping.valid()) {
            errorMessage += `LineMapping invalid: ${this._lineMapping.error} \n`
        }
        if (!this._appliedStatus.valid()) {
            errorMessage += `AppliedStatus invalid: ${this._appliedStatus.error} \n`
        }
        if (!this._suggestions.valid()) {
            errorMessage += `Patterns invalid: ${this._suggestions.error} \n`
        }
        if (!this._hotspots.valid()) {
            errorMessage += `Hotspots invalid: ${this._hotspots.error} \n`
        }
        if (this._combinedSuggestionsValid !== null) {
            errorMessage += `Failed to combine results: ${this._combinedSuggestionsValid} \n`
        }
        if (this._combinedHotspotsValid !== null) {
            errorMessage += `Failed to combine results: ${this._combinedHotspotsValid} \n`
        }
        return errorMessage === '' ? null : errorMessage
    }

    /** error message or null */
    private _combinedSuggestionsValid: string | null = null
    public get validSuggestions(): boolean {
        return (
            this._fileMapping.valid() &&
            this._lineMapping.valid() &&
            this._appliedStatus.valid() &&
            this._suggestions.valid() &&
            this._combinedSuggestionsValid === null
        )
    }

    /** error message or null */
    private _combinedHotspotsValid: string | null = null
    public get validHotspots(): boolean {
        return (
            this._fileMapping.valid() &&
            this._hotspots.valid() &&
            this._combinedHotspotsValid === null
        )
    }

    public get dotDiscopop(): string {
        return this._dotDiscopop
    }

    private _combinedSuggestions: Map<string, CombinedSuggestion[]> = new Map<
        string,
        CombinedSuggestion[]
    >()
    public get suggestions(): Map<string, CombinedSuggestion[]> {
        return this._combinedSuggestions
    }
    private _recomputeCombinedSuggestions() {
        this._combinedSuggestions.clear()
        for (const suggestions of this._suggestions.suggestions.entries()) {
            const combinedSuggestions: CombinedSuggestion[] = []
            for (const suggestion of suggestions[1]) {
                combinedSuggestions.push({
                    patternID: suggestion.id,
                    type: suggestion.type,
                    fileID: suggestion.fileId,
                    filePath: this._fileMapping.getFilePath(suggestion.fileId),
                    originalStartLine: suggestion.startLine,
                    originalEndLine: suggestion.endLine,
                    mappedStartLine: this._lineMapping.getMappedLineNr(
                        suggestion.fileId,
                        suggestion.startLine
                    ),
                    mappedEndLine: this._lineMapping.getMappedLineNr(
                        suggestion.fileId,
                        suggestion.endLine
                    ),
                    applicable: suggestion.applicable_pattern,
                    applied: this._appliedStatus.isApplied(suggestion.id),
                    markedForExport: false,
                    dotDiscopop: this._dotDiscopop,
                    pureJSON: suggestion.pureJSON,
                })
            }
            this._combinedSuggestions.set(suggestions[0], combinedSuggestions)
        }
    }

    private _combinedHotspots: Map<string, CombinedHotspot[]> = new Map<
        string,
        CombinedHotspot[]
    >()
    public get hotspots(): Map<string, CombinedHotspot[]> {
        console.log(this._combinedHotspots)
        return this._combinedHotspots
    }
    private _recomputeCombinedHotspots() {
        try {
            this._combinedHotspots.clear()
            for (const hotspots of this._hotspots.hotspots.entries()) {
                const combinedHotspots: CombinedHotspot[] = []
                for (const hotspot of hotspots[1]) {
                    combinedHotspots.push({
                        type: hotspots[0],
                        fileID: hotspot.fileId,
                        filePath: this._fileMapping.getFilePath(hotspot.fileId),
                        originalStartLine: hotspot.startLine,
                        mappedStartLine: this._lineMapping.getMappedLineNr(
                            hotspot.fileId,
                            hotspot.startLine
                        ),
                        pureJSON: hotspot,
                    })
                }
                this._combinedHotspots.set(hotspots[0], combinedHotspots)
            }
            this._combinedHotspotsValid = null
        } catch (error: any) {
            this._combinedHotspots.clear()
            console.error(error)
        }
    }

    public updateAll(dotDiscopop: string = this._dotDiscopop) {
        // update
        this._dotDiscopop = dotDiscopop
        this._fileMapping.update(this._dotDiscopop)
        this._lineMapping.update(this._dotDiscopop)
        this._appliedStatus.update(this._dotDiscopop)
        this._suggestions.update(this._dotDiscopop)
        this._hotspots.update(this._dotDiscopop)

        // recompute
        this._recomputeCombinedHotspots()
        this._recomputeCombinedSuggestions()
    }

    public updateSuggestions() {
        // update
        this._suggestions.update()

        // recompute
        this._recomputeCombinedSuggestions()
    }

    public updateHotspots() {
        // update
        this._hotspots.update()

        // recompute
        this._recomputeCombinedHotspots()
    }

    public updateFileMapping() {
        // update
        this._fileMapping.update()

        if (!this._fileMapping.valid()) {
            this._combinedSuggestions.clear()
            this._combinedHotspots.clear()
            return
        }

        // recompute suggestions
        this._combinedSuggestions.forEach((list) => {
            list.forEach((combinedSuggestion) => {
                combinedSuggestion.filePath = this._fileMapping.getFilePath(
                    combinedSuggestion.fileID
                )
            })
        })

        // recompute hotspots
        this._combinedHotspots.forEach((list) => {
            list.forEach((combinedHotspot) => {
                combinedHotspot.filePath = this._fileMapping.getFilePath(
                    combinedHotspot.fileID
                )
            })
        })
    }

    /** reread the line_mapping.json */
    public updateLineMapping() {
        // update
        this._lineMapping.update()

        if (!this._lineMapping.valid()) {
            this._combinedSuggestions.clear()
            return
        } else {
            // update lineNumbers of already computed suggestions
            this._combinedSuggestions.forEach((list) => {
                list.forEach((combinedSuggestion) => {
                    combinedSuggestion.mappedStartLine =
                        this._lineMapping.getMappedLineNr(
                            combinedSuggestion.fileID,
                            combinedSuggestion.originalStartLine
                        )
                    combinedSuggestion.mappedEndLine =
                        this._lineMapping.getMappedLineNr(
                            combinedSuggestion.fileID,
                            combinedSuggestion.originalEndLine
                        )
                })
            })
        }

        // update lineNumbers of computed hotspots anyways
        // (lineMapping defaults to original line numbers if no mapping is found)
        if (this._combinedHotspots.size > 0) {
            this._combinedHotspots.forEach((list) => {
                list.forEach((combinedHotspot) => {
                    combinedHotspot.mappedStartLine =
                        this._lineMapping.getMappedLineNr(
                            combinedHotspot.fileID,
                            combinedHotspot.originalStartLine
                        )
                })
            })
        }
    }

    /** reread the applied_suggestions.json */
    public updateAppliedStatus() {
        // update
        this._appliedStatus.update()

        if (!this._appliedStatus.valid()) {
            this._combinedSuggestions.clear()
            return
        }

        // recompute suggestions
        if (this._combinedSuggestions.size > 0) {
            this._combinedSuggestions.forEach((list) => {
                list.forEach((combinedSuggestion) => {
                    combinedSuggestion.applied = this._appliedStatus.isApplied(
                        combinedSuggestion.patternID
                    )
                })
            })
        }
    }
}
