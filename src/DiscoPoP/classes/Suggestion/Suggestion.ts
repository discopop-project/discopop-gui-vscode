import { LineMapping } from '../../../LineMapping/LineMapping'

export abstract class Suggestion {
    applied: boolean = false

    constructor(
        // parsed fields
        public id: number,
        public type: string,
        public fileId: number,
        public startLine: number,
        public endLine: number,
        // complete JSON data
        public pureJSONData: any
    ) {}

    public getMappedStartLine(lineMapping: LineMapping): number {
        return lineMapping.getMappedLine(this.fileId, this.startLine)
    }

    public getMappedEndLine(lineMapping: LineMapping): number {
        return lineMapping.getMappedLine(this.fileId, this.endLine)
    }
}
