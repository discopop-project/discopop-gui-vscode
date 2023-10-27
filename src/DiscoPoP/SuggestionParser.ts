import * as fs from 'fs'
import { DiscoPoPResults } from './classes/DiscoPoPResults'
import { Suggestion } from './classes/Suggestion/Suggestion'
import { DoAllSuggestion } from './classes/Suggestion/DoAllSuggestion'
import { ReductionSuggestion } from './classes/Suggestion/ReductionSuggestion'
import { GenericSuggestion } from './classes/Suggestion/GenericSuggestion'

export abstract class SuggestionParser {
    private constructor() {
        throw new Error('This class should not be instantiated')
    }

    public static parseFile(path: string): DiscoPoPResults {
        const suggestionsString = fs.readFileSync(path, 'utf-8')
        return SuggestionParser.parseString(suggestionsString)
    }

    public static parseString(text: string): DiscoPoPResults {
        const suggestions = JSON.parse(text)
        return SuggestionParser.parseJSON(suggestions)
    }

    public static parseJSON(json: any): DiscoPoPResults {
        // TODO validate the json object
        const suggestionsByType: Map<string, Suggestion[]> = new Map()
        for (const [type, suggestions] of Object.entries(json) as [
            string,
            any[]
        ][]) {
            const suggestionList: Suggestion[] = []
            for (const suggestion of suggestions) {
                // read general fields
                const node_id: string = suggestion.node_id // fileID:CUID
                const [start_file, start_line] = (
                    suggestion.start_line as string
                ).split(':') // fileID:lineNr
                const [_, endLine] = (suggestion.end_line as string).split(':') // fileID:lineNr
                const pragma: string = '#pragma omp ...'

                if (type === 'do_all') {
                    suggestionList.push(
                        new DoAllSuggestion(
                            node_id,
                            Number(start_file),
                            Number(start_line),
                            Number(endLine.split(':')[1]),
                            pragma,
                            suggestion
                            // we can parse more fields from the patterns.json file and use them, if we need to
                        )
                    )
                } else if (type === 'reduction') {
                    suggestionList.push(
                        new ReductionSuggestion(
                            node_id,
                            Number(start_file),
                            Number(start_line),
                            Number(endLine.split(':')[1]),
                            pragma,
                            suggestion
                            // we can parse more fields from the patterns.json file and use them, if we need to
                        )
                    )
                } else {
                    suggestionList.push(
                        new GenericSuggestion(
                            node_id,
                            Number(start_file),
                            Number(start_line),
                            Number(endLine.split(':')[1]),
                            pragma,
                            suggestion
                        )
                    )
                }
            }
            suggestionsByType.set(type, suggestionList)
        }
        return new DiscoPoPResults(suggestionsByType)
    }
}
