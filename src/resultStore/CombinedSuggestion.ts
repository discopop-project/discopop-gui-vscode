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
    dotDiscopop: string // TODO this is rather new and not used everywhere yet, but it should be!
    markedForExport: boolean
    pureJSON: any
}
