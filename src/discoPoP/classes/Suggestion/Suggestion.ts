import { LineMapping } from '../../../lineMapping/LineMapping'
import { DiscoPoPAppliedSuggestionsWatcher } from '../../DiscoPoPAppliedSuggestionsWatcher'

export abstract class Suggestion {
    constructor(
        public id: number,
        public type: string,
        public fileId: number,
        public startLine: number,
        public endLine: number,
        public pureJSONData: any
    ) {}

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
