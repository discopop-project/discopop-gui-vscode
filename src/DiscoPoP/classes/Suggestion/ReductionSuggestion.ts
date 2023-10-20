import * as vscode from 'vscode'
import { Suggestion } from './Suggestion'

export class ReductionSuggestion extends Suggestion {
    // priv: string[]; // "private" is a reserved keyword
    // shared: string[];
    // firstPrivate: string[];
    // reduction: string[];
    // lastPrivate: string[];

    public constructor(
        id: string,
        fileId: number,
        startLine: number,
        endLine: number,
        pragma: string,
        pureJSONData: any
        // priv: string[],
        // shared: string[],
        // firstPrivate: string[],
        // reduction: string[],
        // lastPrivate: string[]
    ) {
        super(id, fileId, startLine, endLine, pragma, pureJSONData)
        // this.priv = priv;
        // this.shared = shared;
        // this.firstPrivate = firstPrivate;
        // this.reduction = reduction;
        // this.lastPrivate = lastPrivate;
    }

    // TODO duplicate code (see DoAllSuggestion)
    getCodeLens(): vscode.CodeLens {
        const codeLens = new vscode.CodeLens(
            new vscode.Range(this.startLine - 1, 0, this.startLine - 1, 0),
            {
                title: `REDUCTION recommended with pragma: ${this.pragma}. Click to insert.`,
                command: 'discopop.codelensAction',
                arguments: [this],
            }
        )

        return codeLens
    }
}
