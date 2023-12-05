import { FileMapping } from '../../FileMapping/FileMapping'
import { LineMapping } from '../../LineMapping/LineMapping'
import { DiscoPoPAppliedSuggestionsWatcher } from '../DiscoPoPAppliedSuggestionsWatcher'
import { Suggestion } from './Suggestion/Suggestion'

export class DiscoPoPResults {
    public constructor(
        public dotDiscoPoP: string,
        public suggestionsByType: Map<string, Suggestion[]>,
        public fileMapping: FileMapping,
        public lineMapping: LineMapping,
        public appliedStatus: DiscoPoPAppliedSuggestionsWatcher
    ) {}

    public getSuggestionById(id: number): Suggestion | undefined {
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

    // TODO getSuggestionsForFileId(fileId: number): Suggestion[] { ... }
    // TODO getSuggestionsForFile(file: string): Suggestion[] { ... }
    // TODO getSuggestionsForType(type: string): Suggestion[] { ... }
}
