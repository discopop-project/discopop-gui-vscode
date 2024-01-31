import { Suggestion } from './Suggestion'

export class DoAllSuggestion extends Suggestion {
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
            'do_all',
            fileId,
            startLine,
            endLine,
            applicable_pattern,
            pureJSONData
        )
    }
}
