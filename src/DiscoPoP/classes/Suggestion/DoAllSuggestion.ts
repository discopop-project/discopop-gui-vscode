import * as vscode from 'vscode'
import { Suggestion } from './Suggestion'

export class DoAllSuggestion extends Suggestion {
    iterations: number
    instructions: number
    workload: number
    priv: string[]
    shared: string[]
    firstPrivate: string[]
    reduction: string[]
    lastPrivate: string[]

    public constructor(
        id: string,
        fileId: number,
        startLine: number,
        endLine: number,
        pragma: string,
        pureJSONData: any
        // other fields are currently not used:
        // iterations: number,
        // instructions: number,
        // workload: number,
        // priv: string[],
        // shared: string[],
        // firstPrivate: string[],
        // reduction: string[],
        // lastPrivate: string[]
    ) {
        super(id, fileId, startLine, endLine, pragma, pureJSONData)
    }

    // TODO duplicate code (see ReductionSuggestion)
    getCodeLens(): vscode.CodeLens {
        const codeLens = new vscode.CodeLens(
            new vscode.Range(this.startLine - 1, 0, this.startLine - 1, 0),
            {
                title: `DOALL recommended with pragma: ${this.pragma}. Click to insert.`,
                command: 'discopop.codelensAction',
                arguments: [this],
            }
        )

        return codeLens
    }
}
