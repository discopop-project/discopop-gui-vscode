import * as fs from 'fs'
import { DoAllSuggestion } from './classes/Suggestion/DoAllSuggestion'
import { GenericSuggestion } from './classes/Suggestion/GenericSuggestion'
import { ReductionSuggestion } from './classes/Suggestion/ReductionSuggestion'
import { Suggestion } from './classes/Suggestion/Suggestion'
import { DebugConsoleMode } from 'vscode'

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
        const suggestionsJSON = JSON.parse(text)
        return DiscoPoPPatternParser.parseJSON(suggestionsJSON)
    }

    public static parseJSON(json: any): Map<string, Suggestion[]> {
        // const expectedVersion = '3.1.1'
        // if (!json.version || json.version !== expectedVersion) {
        //     console.error(
        //         ` Unsupported version of patterns json. You may be using an unsupported version of DiscoPoP. Expected patterns.json version: ${expectedVersion}, found: ${
        //             json.version ?? 'unknown'
        //         }`
        //     )
        // }
        // TODO when we implement a better versioning system, we should check for a compatible version here

        if (!json.patterns) {
            throw new DiscoPoPPatternParserError(
                'No patterns field found in patterns json'
            )
        }

        // TODO check if patterns.json is valid

        const suggestionsByType: Map<string, Suggestion[]> = new Map()
        for (const [type, suggestions] of Object.entries(json.patterns) as [
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

export class DiscoPoPPatternParserError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'DiscoPoPPatternParserError'
    }
}
