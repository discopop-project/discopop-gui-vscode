import { AppliedStatus } from './pureResults/AppliedStatus'
import { FileMapping } from './pureResults/FileMapping'
import { Hotspots } from './pureResults/Hotspots'
import { LineMapping } from './pureResults/LineMapping'
import { Suggestions } from './pureResults/Suggestions'
import { CombinedHotspot } from './resultStore/CombinedHotspot'
import { CombinedSuggestion } from './resultStore/CombinedSuggestion'

export class ResultStore {
    private readonly _fileMapping: FileMapping
    private readonly _lineMapping: LineMapping
    private readonly _appliedStatus: AppliedStatus
    private readonly _suggestions: Suggestions
    private readonly _hotspots: Hotspots

    public constructor(private _dotDiscopop: string) {
        this._suggestions = new Suggestions(_dotDiscopop)
        this._hotspots = new Hotspots(_dotDiscopop)
        this._fileMapping = new FileMapping(_dotDiscopop)
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
        return this._fileMapping.valid() && this._hotspots.valid()
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
    }

    /** reread all results */
    public updateAll(dotDiscopop: string = this._dotDiscopop) {
        this._dotDiscopop = dotDiscopop
        this._fileMapping.update(this._dotDiscopop)
        this._lineMapping.update(this._dotDiscopop)
        this._appliedStatus.update(this._dotDiscopop)
        this._suggestions.update(this._dotDiscopop)
        this._hotspots.update(this._dotDiscopop)
        this._recomputeCombinedSuggestions()
        this._recomputeCombinedHotspots()
    }

    /** reread the patterns.json */
    public updateSuggestions() {
        this._suggestions.update()
        this._recomputeCombinedSuggestions()
    }

    /** reread the Hotspots.json */
    public updateHotspots() {
        this._hotspots.update()
        this._recomputeCombinedHotspots()
    }

    /** reread the FileMapping.txt */
    public updateFileMapping() {
        this._fileMapping.update()
        if (this._combinedSuggestions.size > 0) {
            this._combinedSuggestions.forEach((list) => {
                list.forEach((combinedSuggestion) => {
                    combinedSuggestion.filePath = this._fileMapping.getFilePath(
                        combinedSuggestion.fileID
                    )
                })
            })
        }

        if (this._combinedHotspots.size > 0) {
            this._combinedHotspots.forEach((list) => {
                list.forEach((combinedHotspot) => {
                    combinedHotspot.filePath = this._fileMapping.getFilePath(
                        combinedHotspot.fileID
                    )
                })
            })
        }
    }

    /** reread the line_mapping.json */
    public updateLineMapping() {
        this._lineMapping.update()
        if (this._combinedSuggestions.size > 0) {
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
        this._appliedStatus.update()
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
