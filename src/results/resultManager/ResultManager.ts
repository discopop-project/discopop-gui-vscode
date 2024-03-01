import { CombinedHotspot } from '../combinedResults/CombinedHotspot'
import { CombinedSuggestion } from '../combinedResults/CombinedSuggestion'
import { AppliedStatus } from '../pureResults/AppliedStatus'
import { FileMapping } from '../pureResults/FileMapping'
import { Hotspots } from '../pureResults/Hotspots'
import { LineMapping } from '../pureResults/LineMapping'
import { Suggestions } from '../pureResults/Suggestions'

export class ResultManager {
    private readonly _fileMapping: FileMapping
    private readonly _lineMapping: LineMapping
    private readonly _appliedStatus: AppliedStatus
    private readonly _suggestions: Suggestions
    private readonly _hotspots: Hotspots

    public constructor(private _dotDiscopop: string) {
        this._fileMapping = new FileMapping(_dotDiscopop)
        this._suggestions = new Suggestions(_dotDiscopop)
        this._hotspots = new Hotspots(_dotDiscopop)
        this._lineMapping = new LineMapping(_dotDiscopop)
        this._appliedStatus = new AppliedStatus(_dotDiscopop)
        if (this.validSuggestions()) {
            this._recomputeCombinedSuggestions()
        }
        if (this.validHotspots()) {
            this._recomputeCombinedHotspots()
        }
    }

    /**
     * returns true if the discoPoP results have all been parsed successfully.
     */
    public validSuggestions(): boolean {
        return (
            this._fileMapping.valid() &&
            this._lineMapping.valid() &&
            this._appliedStatus.valid() &&
            this._suggestions.valid()
        )
    }

    /**
     * returns true if the hotspot detection results have all been parsed successfully.
     * Note that the line_mapping is not required to be valid for this to return true.
     */
    public validHotspots(): boolean {
        return (
            this._fileMapping.valid() &&
            this._lineMapping.valid() &&
            this._hotspots.valid()
        )
    }

    public get dotDiscopop(): string {
        return this._dotDiscopop
    }

    public getSuggestionByID(patternID: number): CombinedSuggestion {
        for (const suggestions of this._suggestions.suggestions.values()) {
            for (const suggestion of suggestions) {
                if (suggestion.id === patternID) {
                    return {
                        patternID: suggestion.id,
                        type: suggestion.type,
                        filePath: this._fileMapping.getFilePath(
                            suggestion.fileId
                        ),
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
                        pureJSON: suggestion.pureJSON,
                    }
                }
            }
        }
        return undefined
    }
    private _combinedSuggestions: Map<string, CombinedSuggestion[]> = new Map<
        string,
        CombinedSuggestion[]
    >()
    /** make sure to check {@link validSuggestions} is true! */
    public get suggestions(): Map<string, CombinedSuggestion[]> {
        console.log(this._combinedSuggestions)
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
                    filePath: this._fileMapping.getFilePath(suggestion.fileId),
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
    /** make sure to check {@link validHotspots} is true!*/
    public get hotspots(): Map<string, CombinedHotspot[]> {
        console.log(this._combinedHotspots)
        return this._combinedHotspots
    }
    private _recomputeCombinedHotspots() {
        this._combinedHotspots.clear()
        for (const hotspots of this._hotspots.hotspots.entries()) {
            const combinedHotspots: CombinedHotspot[] = []
            for (const hotspot of hotspots[1]) {
                combinedHotspots.push({
                    type: hotspots[0],
                    filePath: this._fileMapping.getFilePath(hotspot.fileId),
                    startLine: this._lineMapping.getMappedLineNr(
                        hotspot.fileId,
                        hotspot.startLine
                    ),
                    pureJSON: hotspot,
                })
            }
            this._combinedHotspots.set(hotspots[0], combinedHotspots)
        }
    }

    public update(dotDiscopop: string = this._dotDiscopop) {
        this._dotDiscopop = dotDiscopop
        this._fileMapping.update(this._dotDiscopop)
        this._lineMapping.update(this._dotDiscopop)
        this._appliedStatus.update(this._dotDiscopop)
        this._suggestions.update(this._dotDiscopop)
        this._hotspots.update(this._dotDiscopop)
        this._recomputeCombinedSuggestions()
        this._recomputeCombinedHotspots()
    }

    // public updateSuggestions() {
    //     this._suggestions.update()
    //     // TODO: recompute combined suggestions
    // }

    // public updateHotspots() {
    //     this._hotspots.update()
    //     // TOOD: recompute combined hotspots
    // }

    // public updateFileMapping() {
    //     this._fileMapping.update()
    //     // TODO: update combined suggestions (do not recompute, just update the file paths)
    // }

    // public updateLineMapping() {
    //     this._lineMapping.update()
    //     // TODO: update combined suggestions (do not recompute, just update the line numbers)
    // }

    // public updateAppliedStatus() {
    //     this._appliedStatus.update()
    //     // TODO: update combined suggestions (do not recompute, just update the applied status)
    // }
}
