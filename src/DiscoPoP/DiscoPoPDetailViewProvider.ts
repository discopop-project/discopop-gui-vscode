import * as vscode from 'vscode'
import { Suggestion } from './classes/Suggestion/Suggestion'

export class DiscoPoPDetailViewProvider implements vscode.WebviewViewProvider {
    private static context: vscode.ExtensionContext
    private suggestion: Suggestion
    private webView: vscode.Webview | undefined

    // singleton pattern
    private static instance: DiscoPoPDetailViewProvider | undefined

    public static getInstance(
        context: vscode.ExtensionContext,
        suggestion: Suggestion
    ): DiscoPoPDetailViewProvider {
        DiscoPoPDetailViewProvider.context = context
        if (!DiscoPoPDetailViewProvider.instance) {
            DiscoPoPDetailViewProvider.instance =
                new DiscoPoPDetailViewProvider(suggestion)
            vscode.window.registerWebviewViewProvider(
                'detail-view',
                DiscoPoPDetailViewProvider.instance
            )
        } else {
            DiscoPoPDetailViewProvider.instance.setOrReplaceSuggestion(
                suggestion
            )
        }
        return DiscoPoPDetailViewProvider.instance
    }

    private constructor(suggestion: Suggestion) {
        this.setOrReplaceSuggestion(suggestion)
    }

    private setOrReplaceSuggestion(suggestion: Suggestion) {
        this.suggestion = suggestion
        this.updateContents()
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext<unknown>,
        token: vscode.CancellationToken
    ): void | Thenable<void> {
        this.webView = webviewView.webview // save the webview for later updates
        this.updateContents()
    }

    private updateContents(): void {
        if (this.webView) {
            const suggestionString = JSON.stringify(
                this.suggestion.pureJSONData,
                undefined,
                4
            )
            this.webView.html = `<pre>${suggestionString}</pre>`
        }
    }
}
