export interface CombinedSuggestion {
    patternID: number
    type: string
    filePath: string
    startLine: number
    endLine: number
    applicable: boolean
    applied: boolean
    pureJSON: any
}
