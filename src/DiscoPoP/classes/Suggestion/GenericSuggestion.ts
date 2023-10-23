import * as vscode from 'vscode'
import { Suggestion } from './Suggestion'
import { DiscoPoPCodeLens } from '../../../CodeLensProvider'
import { Commands } from '../../../Commands'

/**
 * This class is used for suggestions that are of a type that is not yet implemented in this GUI.
 */
export class GenericSuggestion extends Suggestion {
    constructor(
        id: string,
        fileId: number,
        startLine: number,
        endLine: number,
        pragma: string,
        pureJSONData: any
    ) {
        super(id, fileId, startLine, endLine, pragma, pureJSONData)
    }
}
