import * as vscode from 'vscode'
import { Suggestion } from './Suggestion'
import { DiscoPoPCodeLens } from '../../../CodeLensProvider'
import { Commands } from '../../../Commands'

export class ReductionSuggestion extends Suggestion {
    // TODO we might want to parse other fields from the patterns.json file and add them here

    public constructor(
        id: string,
        fileId: number,
        startLine: number,
        endLine: number,
        pragma: string,
        pureJSONData: any
    ) {
        super(id, fileId, startLine, endLine, pragma, pureJSONData)
    }

    // TODO duplicate code (see DoAllSuggestion)
    getCodeLens(): DiscoPoPCodeLens {
        return new DiscoPoPCodeLens(this)
    }
}
