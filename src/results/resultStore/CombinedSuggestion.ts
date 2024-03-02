export interface CombinedSuggestion {
    patternID: number
    type: string
    fileID: number
    filePath: string
    originalStartLine: number
    originalEndLine: number
    mappedStartLine: number
    mappedEndLine: number
    applicable: boolean
    applied: boolean
    pureJSON: any
}
