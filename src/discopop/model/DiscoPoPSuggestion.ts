import { DiscoPoPAppliedSuggestionsWatcher } from '../DiscoPoPAppliedSuggestionsWatcher'
import { LineMapping } from './LineMapping'

export class DiscoPoPSuggestion {
    public readonly applicable_pattern: boolean
    constructor(
        public id: number,
        public type: string,
        public fileId: number,
        public startLine: number,
        public endLine: number,
        applicable_pattern: boolean | undefined, // assumed true if undefined
        public pureJSONData: any
    ) {
        if (applicable_pattern === undefined) {
            this.applicable_pattern = true
        } else {
            this.applicable_pattern = applicable_pattern
        }
    }

    public getMappedStartLine(lineMapping: LineMapping): number {
        if (!lineMapping) {
            console.error('lineMapping is undefined, using original startLine')
            return this.startLine
        }
        return lineMapping.getMappedLineNr(this.fileId, this.startLine)
    }

    public getMappedEndLine(lineMapping: LineMapping): number {
        if (!lineMapping) {
            console.error('lineMapping is undefined, using original endLine')
            return this.startLine
        }
        return lineMapping.getMappedLineNr(this.fileId, this.endLine)
    }

    public isApplied(
        appliedStatus: DiscoPoPAppliedSuggestionsWatcher
    ): boolean {
        return appliedStatus.isApplied(this.id)
    }
}
