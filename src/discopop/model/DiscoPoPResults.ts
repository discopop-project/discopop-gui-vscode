import * as fs from 'fs'
import { DiscoPoPAppliedSuggestionsWatcher } from './DiscoPoPAppliedSuggestionsWatcher'
import { DiscoPoPSuggestion } from './DiscoPoPSuggestion'
import { FileMapping } from './FileMapping'
import { LineMapping } from './LineMapping'

export class DiscoPoPResults {
    public constructor(
        public dotDiscoPoP: string,
        public suggestionsByType: Map<string, DiscoPoPSuggestion[]>,
        public fileMapping: FileMapping,
        public lineMapping: LineMapping,
        public appliedStatus: DiscoPoPAppliedSuggestionsWatcher
    ) {}

    public static async parse(dotDiscoPoP: string): Promise<DiscoPoPResults> {
        // parse FileMapping.txt
        const fileMapping = FileMapping.parseFile(
            `${dotDiscoPoP}/FileMapping.txt`
        )

        // parse patterns.json
        // use explorer/patterns.json by default
        let patternsJson = `${dotDiscoPoP}/explorer/patterns.json`
        // if optimizer/patterns.json exists, use it instead
        if (fs.existsSync(`${dotDiscoPoP}/optimizer/patterns.json`)) {
            patternsJson = `${dotDiscoPoP}/optimizer/patterns.json`
        }
        const suggestionsByType: Map<string, DiscoPoPSuggestion[]> =
            DiscoPoPSuggestion.parseFile(patternsJson)

        // create LineMappingWatcher
        const lineMappingFile = `${dotDiscoPoP}/line_mapping.json`
        const lineMapping = new LineMapping(lineMappingFile)

        // create AppliedSuggestionsWatcher
        const appliedSuggestionsFile = `${dotDiscoPoP}/patch_applicator/applied_suggestions.json`
        const appliedStatus = new DiscoPoPAppliedSuggestionsWatcher(
            appliedSuggestionsFile
        )

        return new DiscoPoPResults(
            dotDiscoPoP,
            suggestionsByType!,
            fileMapping!,
            lineMapping!,
            appliedStatus!
        )
    }

    public getSuggestionById(id: number): DiscoPoPSuggestion | undefined {
        for (const suggestions of this.suggestionsByType.values()) {
            for (const suggestion of suggestions) {
                if (suggestion.id === id) {
                    return suggestion
                }
            }
        }
        return undefined
    }

    public dispose() {
        this.lineMapping?.dispose()
        this.appliedStatus?.dispose()
    }

    public get count(): number {
        let count = 0
        for (const suggestions of this.suggestionsByType.values()) {
            count += suggestions.length
        }
        return count
    }

    public get countApplicable(): number {
        let count = 0
        for (const suggestions of this.suggestionsByType.values()) {
            for (const suggestion of suggestions) {
                if (suggestion.applicable_pattern) {
                    count++
                }
            }
        }
        return count
    }

    // TODO getSuggestionsForFileId(fileId: number): Suggestion[] { ... }
    // TODO getSuggestionsForFile(file: string): Suggestion[] { ... }
    // TODO getSuggestionsForType(type: string): Suggestion[] { ... }
}
