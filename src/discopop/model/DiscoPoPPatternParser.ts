import * as fs from 'fs'
import { DiscoPoPSuggestion } from './DiscoPoPSuggestion'

/**
 * Provides methods to parse the patterns.json file
 */
export abstract class DiscoPoPPatternParser {
    private constructor() {
        throw new Error('This class should not be instantiated')
    }

    public static parseFile(path: string): Map<string, DiscoPoPSuggestion[]> {
        if (!fs.existsSync(path)) {
            throw new DiscoPoPPatternParserError(
                'patterns.json file not found.'
            )
        }
        const suggestionsString = fs.readFileSync(path, 'utf-8')
        return DiscoPoPPatternParser.parseString(suggestionsString)
    }

    public static parseString(text: string): Map<string, DiscoPoPSuggestion[]> {
        const suggestionsJSON = JSON.parse(text)
        return DiscoPoPPatternParser.parseJSON(suggestionsJSON)
    }

    public static parseJSON(json: any): Map<string, DiscoPoPSuggestion[]> {
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

        const suggestionsByType: Map<string, DiscoPoPSuggestion[]> = new Map()
        for (const [type, suggestions] of Object.entries(json.patterns) as [
            string,
            any[]
        ][]) {
            const suggestionList: DiscoPoPSuggestion[] = []
            for (const suggestion of suggestions) {
                // read general fields
                const pattern_id: number = suggestion.pattern_id
                const node_id: string = suggestion.node_id // fileID:CUID
                const [start_file, start_line] = (
                    suggestion.start_line as string
                ).split(':') // fileID:lineNr
                const [_, end_line] = (suggestion.end_line as string).split(':') // fileID:lineNr
                const applicable_pattern: boolean | undefined =
                    suggestion.applicable_pattern
                suggestionList.push(
                    new DiscoPoPSuggestion(
                        pattern_id,
                        type,
                        Number(start_file),
                        Number(start_line),
                        Number(end_line),
                        applicable_pattern,
                        suggestion
                    )
                )
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
