export interface CombinedSuggestion {
    patternID: number
    type: string
    filePath: string
    mappedStartLine: number
    mappedEndLine: number
    applicable: boolean
    applied: boolean
    pureJSON: any
}
