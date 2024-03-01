import * as vscode from 'vscode'
import { JSONWebViewProvider } from '../utils/JSONWebViewProvider'

export class SuggestionDetailViewer extends JSONWebViewProvider<any> {
    public constructor(
        suggestionJSON: any | undefined,
        context: vscode.ExtensionContext
    ) {
        super(
            suggestionJSON,
            `No suggestion selected. Select a suggestion to see the details here.`,
            context,
            'sidebar-suggestion-detail-view'
        )
    }
}
