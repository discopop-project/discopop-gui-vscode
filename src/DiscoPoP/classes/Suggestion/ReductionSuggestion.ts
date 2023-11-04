import { Suggestion } from './Suggestion'

export class ReductionSuggestion extends Suggestion {
    public constructor(
        id: number,
        fileId: number,
        startLine: number,
        endLine: number,
        pureJSONData: any
        // we can parse more fields from the patterns.json file and use them, if we need to
    ) {
        super(id, fileId, startLine, endLine, pureJSONData)
    }
}
