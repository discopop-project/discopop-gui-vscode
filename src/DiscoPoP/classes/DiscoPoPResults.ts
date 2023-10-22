import { Suggestion } from './Suggestion/Suggestion'
import { DoAllSuggestion } from './Suggestion/DoAllSuggestion'
import { ReductionSuggestion } from './Suggestion/ReductionSuggestion'

export class DiscoPoPResults {
    // maps type --> [suggestion1, suggestion2, ...]
    public suggestionsByType: Map<string, Suggestion[]>

    public constructor(suggestionsByType: Map<string, Suggestion[]>) {
        this.suggestionsByType = suggestionsByType
    }

    getAllSuggestions(): Suggestion[] {
        return Array.from(this.suggestionsByType.values()).flat()
    }
}
