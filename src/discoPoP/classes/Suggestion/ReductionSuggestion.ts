import { Suggestion } from './Suggestion'

export class ReductionSuggestion extends Suggestion {
    public constructor(
        id: number,
        fileId: number,
        startLine: number,
        endLine: number,
        pureJSONData: any
    ) {
        super(id, 'reduction', fileId, startLine, endLine, pureJSONData)
    }
}
