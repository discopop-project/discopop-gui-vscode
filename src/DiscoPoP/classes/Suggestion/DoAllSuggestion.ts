import { Suggestion } from './Suggestion'

export class DoAllSuggestion extends Suggestion {
    public constructor(
        id: number,
        fileId: number,
        startLine: number,
        endLine: number,
        pureJSONData: any
    ) {
        super(id, 'do_all', fileId, startLine, endLine, pureJSONData)
    }
}
