import { AppliedStatus } from '../model/AppliedStatus'
import { FileMapping } from '../model/FileMapping'
import { Hotspot } from '../model/Hotspot'
import { LineMapping } from '../model/LineMapping'
import { Suggestion } from '../model/Suggestion'
import { CombinedHotspot } from './CombinedHotspot'
import { CombinedSuggestion } from './CombinedSuggestion'

export class CombinedResults {
    public constructor(public readonly dotDiscopop: string) {
        this.reReadFileMapping()
        this.reReadSuggestions()
        this.reReadHotspots()
        this.reReadLineMapping()
        this.reReadAppliedStatus()
    }

    private _fileMapping: FileMapping
    private _suggestions: Map<string, Suggestion[]>
    private _hotspots: Hotspot[]
    private _lineMapping: LineMapping
    private _appliedStatus: AppliedStatus

    public get suggestions(): Map<string, CombinedSuggestion[]> {
        const combinedSuggestions = new Map<string, CombinedSuggestion[]>()
        for (const [type, suggestions] of this._suggestions) {
            combinedSuggestions.set(
                type,
                suggestions.map((suggestion) => {
                    return {
                        patternID: suggestion.id,
                        type: suggestion.type,
                        filePath: this._fileMapping.getFilePath(
                            suggestion.fileId
                        ),
                        startLine: this._lineMapping.getMappedLineNr(
                            suggestion.fileId,
                            suggestion.startLine
                        ),
                        endLine: this._lineMapping.getMappedLineNr(
                            suggestion.fileId,
                            suggestion.endLine
                        ),
                        applicable: suggestion.applicable_pattern,
                        applied: this._appliedStatus.isApplied(suggestion.id),
                        pureJSON: suggestion.pureJSON,
                    }
                })
            )
        }
        return combinedSuggestions
    }

    public get hotspots(): Map<string, CombinedHotspot[]> {
        const combinedHotspots = new Map<string, CombinedHotspot[]>()
        combinedHotspots['YES'] = []
        combinedHotspots['NO'] = []
        combinedHotspots['MAYBE'] = []
        for (const hotspot of this._hotspots) {
            const combinedHotspot: CombinedHotspot = {
                type: hotspot.hotness,
                filePath: this._fileMapping.getFilePath(hotspot.fileId),
                startLine: this._lineMapping.getMappedLineNr(
                    hotspot.fileId,
                    hotspot.startLine
                ),
                pureJSON: hotspot.pureJSON,
            }
            combinedHotspots[hotspot.hotness].push(combinedHotspot)
        }
        return combinedHotspots
    }

    public reReadFileMapping() {
        this._fileMapping = FileMapping.parse(this.dotDiscopop)
    }

    public reReadSuggestions() {
        this._suggestions = Suggestion.parse(this.dotDiscopop)
    }

    public reReadHotspots() {
        this._hotspots = Hotspot.parse(this.dotDiscopop)
    }

    public reReadLineMapping() {
        this._lineMapping = LineMapping.parse(this.dotDiscopop)
    }

    public reReadAppliedStatus() {
        this._appliedStatus = AppliedStatus.parse(this.dotDiscopop)
    }
}
