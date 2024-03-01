import * as fs from 'fs'
import { ParsedResultSchema } from './ParsedResultSchema'

export interface Suggestion {
    id: number
    type: string
    fileId: number
    startLine: number
    endLine: number
    applicable_pattern: boolean | undefined
    pureJSON: any
}

export class Suggestions implements ParsedResultSchema {
    public readonly suggestions: Map<string, Suggestion[]> = new Map<
        string,
        Suggestion[]
    >()
    constructor(private _dotDiscopop: string) {
        this.update(_dotDiscopop)
    }

    public update(dotDiscopop: string = this._dotDiscopop): void {
        this._dotDiscopop = dotDiscopop
        // prioritized parsing: patterns.json > optimizer/patterns.json > explorer/patterns.json
        let filePath = `${dotDiscopop}/patterns.json`
        if (!fs.existsSync(filePath)) {
            filePath = `${dotDiscopop}/optimizer/patterns.json`
            if (!fs.existsSync(filePath)) {
                filePath = `${dotDiscopop}/explorer/patterns.json`
                if (!fs.existsSync(filePath)) {
                    this._valid = false
                    this._error = `patterns.json does not exist in any of the expected locations`
                    return
                } else {
                    this._parseFile(filePath)
                }
            }
        }
    }

    private _valid = false
    public valid(): boolean {
        return this._valid
    }

    private _error: string | undefined = undefined
    public error(): string | undefined {
        return this._error
    }

    private _parseFile(path: string): void {
        try {
            // reset internals
            this.suggestions.clear()

            // parse
            // TODO: check version!!!
            const fileContents = fs.readFileSync(path, 'utf-8')
            const json = JSON.parse(fileContents)
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
                    const [_, end_line] = (suggestion.end_line as string).split(
                        ':'
                    ) // fileID:lineNr
                    const applicable_pattern: boolean | undefined =
                        suggestion.applicable_pattern
                    suggestionList.push({
                        id: pattern_id,
                        type: type,
                        fileId: Number(start_file),
                        startLine: Number(start_line),
                        endLine: Number(end_line),
                        applicable_pattern:
                            applicable_pattern === undefined
                                ? true
                                : applicable_pattern,
                        pureJSON: suggestion,
                    })
                }
                this.suggestions.set(type, suggestionList)
            }

            // mark as valid
            this._valid = true
            this._error = undefined
        } catch (error: any) {
            // oops
            this._valid = false
            console.log(error)
            this._error = 'Error parsing patterns.json'
        }
    }
}
