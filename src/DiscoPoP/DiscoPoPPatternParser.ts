import * as fs from 'fs'
import { DoAllSuggestion } from './classes/Suggestion/DoAllSuggestion'
import { GenericSuggestion } from './classes/Suggestion/GenericSuggestion'
import { ReductionSuggestion } from './classes/Suggestion/ReductionSuggestion'
import { Suggestion } from './classes/Suggestion/Suggestion'

/**
 * Provides methods to parse the patterns.json file
 */
export abstract class DiscoPoPPatternParser {
    private constructor() {
        throw new Error('This class should not be instantiated')
    }

    public static parseFile(path: string): Map<string, Suggestion[]> {
        const suggestionsString = fs.readFileSync(path, 'utf-8')
        return DiscoPoPPatternParser.parseString(suggestionsString)
    }

    public static parseString(text: string): Map<string, Suggestion[]> {
        const suggestions = JSON.parse(text)
        return DiscoPoPPatternParser.parseJSON(suggestions)
    }

    public static parseJSON(json: any): Map<string, Suggestion[]> {
        // TODO validate the json object
        const suggestionsByType: Map<string, Suggestion[]> = new Map()
        for (const [type, suggestions] of Object.entries(json) as [
            string,
            any[]
        ][]) {
            const suggestionList: Suggestion[] = []
            for (const suggestion of suggestions) {
                // read general fields
                const pattern_id: number = suggestion.pattern_id
                const node_id: string = suggestion.node_id // fileID:CUID
                const [start_file, start_line] = (
                    suggestion.start_line as string
                ).split(':') // fileID:lineNr
                const [_, end_line] = (suggestion.end_line as string).split(':') // fileID:lineNr

                if (type === 'do_all') {
                    // parse do_all specific fields here, if needed
                    // ...

                    suggestionList.push(
                        new DoAllSuggestion(
                            pattern_id,
                            Number(start_file),
                            Number(start_line),
                            Number(end_line),
                            suggestion
                            // we can parse more fields from the patterns.json file and use them, if we need to
                        )
                    )
                } else if (type === 'reduction') {
                    // parse reduction specific fields here, if needed
                    // ...

                    suggestionList.push(
                        new ReductionSuggestion(
                            pattern_id,
                            Number(start_file),
                            Number(start_line),
                            Number(end_line),
                            suggestion
                            // we can parse more fields from the patterns.json file and use them, if we need to
                        )
                    )
                } else {
                    // unknown suggestion types are represented by GenericSuggestion:
                    suggestionList.push(
                        new GenericSuggestion(
                            pattern_id,
                            type,
                            Number(start_file),
                            Number(start_line),
                            Number(end_line),
                            suggestion
                        )
                    )
                }
            }
            suggestionsByType.set(type, suggestionList)
        }
        return suggestionsByType
    }
}
