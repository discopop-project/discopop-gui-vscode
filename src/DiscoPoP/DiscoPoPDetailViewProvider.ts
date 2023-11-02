import * as vscode from 'vscode'
import { Suggestion } from './classes/Suggestion/Suggestion'

export class DiscoPoPDetailViewProvider implements vscode.WebviewViewProvider {
    private static context: vscode.ExtensionContext
    private suggestion: Suggestion | undefined
    private webView: vscode.Webview | undefined

    // singleton pattern
    private static instance: DiscoPoPDetailViewProvider | undefined

    public static load(
        context: vscode.ExtensionContext,
        suggestion: Suggestion | undefined
    ): void {
        DiscoPoPDetailViewProvider.context = context
        if (!DiscoPoPDetailViewProvider.instance) {
            DiscoPoPDetailViewProvider.instance =
                new DiscoPoPDetailViewProvider(suggestion)
            vscode.window.registerWebviewViewProvider(
                'detail-view',
                DiscoPoPDetailViewProvider.instance
            )
        } else {
            DiscoPoPDetailViewProvider.instance._setOrReplaceSuggestion(
                suggestion
            )
        }
    }

    private constructor(suggestion: Suggestion | undefined) {
        this._setOrReplaceSuggestion(suggestion)
    }

    private _setOrReplaceSuggestion(suggestion: Suggestion | undefined) {
        this.suggestion = suggestion
        this._updateContents()
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext<unknown>,
        token: vscode.CancellationToken
    ): void | Thenable<void> {
        this.webView = webviewView.webview // save the webview for later updates
        this._updateContents()
    }

    private _updateContents(): void {
        if (this.webView) {
            // if no suggestion is selected, provide a placeholder text
            if (!this.suggestion) {
                this.webView.html = `No suggestion selected. Select a suggestion to see the details here.`
            } else {
                const suggestionString = JSON.stringify(
                    this.suggestion.pureJSONData,
                    undefined,
                    4
                )
                this.webView.html = `<pre>${suggestionString}</pre>`
            }
        }
    }
}
