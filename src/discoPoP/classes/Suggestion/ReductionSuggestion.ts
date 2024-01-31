import { Suggestion } from './Suggestion'

export class ReductionSuggestion extends Suggestion {
    public constructor(
        id: number,
        fileId: number,
        startLine: number,
        endLine: number,
        applicable_pattern: boolean | undefined,
        pureJSONData: any
    ) {
        super(
            id,
            'reduction',
            fileId,
            startLine,
            endLine,
            applicable_pattern,
            pureJSONData
        )
    }
}
