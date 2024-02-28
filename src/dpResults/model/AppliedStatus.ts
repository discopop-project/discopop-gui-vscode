import * as fs from 'fs'

export class AppliedStatus {
    public constructor(private readonly _appliedSuggestions: Set<number>) {}

    public isApplied(id: number): boolean {
        return false
    }

    public get appliedSuggestions(): Set<number> {
        return this._appliedSuggestions
    }

    public static parse(dotDiscopop: string): AppliedStatus {
        const filePath = `${dotDiscopop}/patch_applicator/applied_suggestions.json`
        if (!fs.existsSync(filePath)) {
            throw new Error(`File ${filePath} does not exist`)
        }
        return AppliedStatus._parseFile(filePath)
    }

    private static _parseFile(filePath: string): AppliedStatus {
        const appliedSuggestions = new Set<number>()
        const fileContents = fs.readFileSync(filePath, 'utf-8')
        const json = JSON.parse(fileContents)
        for (const idString of json.applied) {
            const id = Number(idString)
            appliedSuggestions.add(id)
        }
        return new AppliedStatus(appliedSuggestions)
    }
}
