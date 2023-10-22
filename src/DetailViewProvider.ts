import * as vscode from 'vscode'
import { Suggestion } from './DiscoPoP/classes/Suggestion/Suggestion'

export class DetailViewProvider implements vscode.WebviewViewProvider {
    private static context: vscode.ExtensionContext
    private suggestion: Suggestion
    private webView: vscode.Webview | undefined

    // singleton pattern
    private static instance: DetailViewProvider | undefined

    public static getInstance(
        context: vscode.ExtensionContext,
        suggestion: Suggestion
    ): DetailViewProvider {
        DetailViewProvider.context = context
        if (!DetailViewProvider.instance) {
            DetailViewProvider.instance = new DetailViewProvider(suggestion)
            vscode.window.registerWebviewViewProvider(
                'detail-view',
                DetailViewProvider.instance
            )
        } else {
            DetailViewProvider.instance.setOrReplaceSuggestion(suggestion)
        }
        return DetailViewProvider.instance
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
