import { LineMapping } from '../../../LineMapping/LineMapping'

export abstract class Suggestion {
    constructor(
        public id: number,
        public type: string,
        public fileId: number,
        public startLine: number,
        public endLine: number,
        public pureJSONData: any,
        public applied: boolean = false
    ) {}

    public getMappedStartLine(lineMapping: LineMapping): number {
        return lineMapping.getMappedLineNr(this.fileId, this.startLine)
    }

    public getMappedEndLine(lineMapping: LineMapping): number {
        return lineMapping.getMappedLineNr(this.fileId, this.endLine)
    }
}
