import * as vscode from 'vscode'
import { CombinedSuggestion } from '../results/resultStore/CombinedSuggestion'

export interface CodeLensManagerCallbacks {
    // TODO overthink what codeLenses should do,
    //
}

// TODO extend CodeLensProvider maybe?
export class CodeLensManager {
    // TODO similar structure as the TreeViews

    private _codeLensProvider: DiscopopCodeLensProvider
    public constructor(
        private _context: vscode.ExtensionContext,
        private _callbacks: CodeLensManagerCallbacks
    ) {
        this._codeLensProvider = new DiscopopCodeLensProvider()
        // TODO register the code lens provider
        // TODO register commands
    }

    public set combinedSuggestions(
        combinedSuggestions: Map<string, CombinedSuggestion[]>
    ) {
        this._codeLensProvider.combinedSuggestions = combinedSuggestions
    }

    public show() {
        // TODO
    }

    public hide() {
        // TODO
    }
}

class DiscopopCodeLensProvider {
    // TODO

    public constructor() {}

    private _combinedSuggestions: Map<string, CombinedSuggestion[]> = undefined
    public set combinedSuggestions(
        combinedSuggestions: Map<string, CombinedSuggestion[]>
    ) {
        this._combinedSuggestions = combinedSuggestions
        // TODO refresh
    }
}
