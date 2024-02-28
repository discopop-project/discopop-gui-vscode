import * as fs from 'fs'

export class Suggestion {
    constructor(
        public readonly id: number,
        public readonly type: string,
        public readonly fileId: number,
        public readonly startLine: number,
        public readonly endLine: number,
        public readonly applicable_pattern: boolean | undefined, // assumed true if undefined
        public readonly pureJSON: any
    ) {
        if (applicable_pattern === undefined) {
            this.applicable_pattern = true
        } else {
            this.applicable_pattern = applicable_pattern
        }
    }

    public static parse(dotDiscopop: string): Map<string, Suggestion[]> {
        // prioritized parsing: patterns.json > optimizer/patterns.json > explorer/patterns.json
        let filePath = `${dotDiscopop}/patterns.json`
        if (!fs.existsSync(filePath)) {
            filePath = `${dotDiscopop}/optimizer/patterns.json`
            if (!fs.existsSync(filePath)) {
                filePath = `${dotDiscopop}/explorer/patterns.json`
                if (!fs.existsSync(filePath)) {
                    throw new Error('no patterns.json file was found.')
                }
            }
        }
        return Suggestion._parseFile(filePath)
    }

    private static _parseFile(path: string): Map<string, Suggestion[]> {
        if (!fs.existsSync(path)) {
            throw new Error('patterns.json file not found.')
        }
        const suggestionsString = fs.readFileSync(path, 'utf-8')
        return Suggestion._parseString(suggestionsString)
    }

    private static _parseString(text: string): Map<string, Suggestion[]> {
        const suggestionsJSON = JSON.parse(text)
        return Suggestion._parseJSON(suggestionsJSON)
    }

    private static _parseJSON(json: any): Map<string, Suggestion[]> {
        // TODO when we implement a better versioning system, we should check for a compatible version here
        // const expectedVersion = '3.1.1'
        // if (!json.version || json.version !== expectedVersion) {
        //     console.error(
        //         ` Unsupported version of patterns json. You may be using an unsupported version of DiscoPoP. Expected patterns.json version: ${expectedVersion}, found: ${
        //             json.version ?? 'unknown'
        //         }`
        //     )
        // }

        if (!json.patterns) {
            throw new Error('No patterns field found in patterns json')
        }

        // TODO check if patterns.json is valid

        const suggestionsByType: Map<string, Suggestion[]> = new Map()
        for (const [type, suggestions] of Object.entries(json.patterns) as [
            string,
            any[]
        ][]) {
            const suggestionList: Suggestion[] = []
            for (const suggestion of suggestions) {
                const pattern_id: number = suggestion.pattern_id
                const [start_file, start_line] = (
                    suggestion.start_line as string
                ).split(':') // fileID:lineNr
                const [_, end_line] = (suggestion.end_line as string).split(':') // fileID:lineNr
                const applicable_pattern: boolean | undefined =
                    suggestion.applicable_pattern
                suggestionList.push(
                    new Suggestion(
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
