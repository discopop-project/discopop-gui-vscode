import * as vscode from 'vscode'
import { CodeLens } from 'vscode'
import { Suggestion } from './Suggestion'

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

    getCodeLens(): CodeLens {
        const codeLens = new vscode.CodeLens(
            new vscode.Range(this.startLine - 1, 0, this.startLine - 1, 0),
            {
                title: `DiscoPoP suggests a parallelization using: ${this.pragma}. Click to insert.`,
                command: 'discopop.codelensAction',
                arguments: [this],
                tooltip:
                    'Note that this type of suggestion is not yet fully supported by the DiscoPoP GUI and might not show up as expected.',
            }
        )

        return codeLens
    }
}
