import * as fs from 'fs'
import { ParsedResultSchema } from './ParsedResultSchema'

export class AppliedStatus implements ParsedResultSchema {
    private readonly _appliedSuggestions: Set<number> = new Set<number>()
    public constructor(private _dotDiscopop: string) {
        this.update(_dotDiscopop)
    }

    public isApplied(patternID: number): boolean {
        return this._appliedSuggestions.has(patternID)
    }

    public get appliedSuggestions(): Iterable<number> {
        return this._appliedSuggestions.values()
    }

    public update(dotDiscopop: string = this._dotDiscopop): void {
        this._dotDiscopop = dotDiscopop
        const filePath = `${dotDiscopop}/patch_applicator/applied_suggestions.json`
        if (!fs.existsSync(filePath)) {
            this._appliedSuggestions.clear()
            this._valid = false
            this._error = `applied_suggestions.json does not exist`
        } else {
            this._parseFile(filePath)
        }
    }

    private _valid = false
    public valid(): boolean {
        return this._valid
    }

    private _error = undefined
    public error(): string | undefined {
        return this._error
    }

    private _parseFile(filePath: string): void {
        try {
            // reset internals
            this._appliedSuggestions.clear()

            // parse
            const fileContents = fs.readFileSync(filePath, 'utf-8')
            const json = JSON.parse(fileContents)
            for (const idString of json.applied) {
                const id = Number(idString)
                this._appliedSuggestions.add(id)
            }

            // mark as valid
            this._valid = true
            this._error = undefined
        } catch (error: any) {
            // oops
            this._valid = false
            console.log(error)
            this._error = 'Error parsing applied_suggestions.json'
        }
    }
}
