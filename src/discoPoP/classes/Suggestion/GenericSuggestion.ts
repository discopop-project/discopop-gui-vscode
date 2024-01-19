import { Suggestion } from './Suggestion'

/**
 * This class is used for suggestions that are of a type that is not yet implemented in this GUI.
 */
export class GenericSuggestion extends Suggestion {
    constructor(
        id: number,
        type: string,
        fileId: number,
        startLine: number,
        endLine: number,
        pureJSONData: any
    ) {
        super(id, type, fileId, startLine, endLine, pureJSONData)
    }
}