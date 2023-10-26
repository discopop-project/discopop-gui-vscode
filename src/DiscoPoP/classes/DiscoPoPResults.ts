import { Suggestion } from './Suggestion/Suggestion'

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
