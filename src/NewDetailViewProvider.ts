import * as vscode from 'vscode'
import { Suggestion } from './SuggestionTreeView/SuggestionTreeDataProvider'

export class NewDetailViewProvider implements vscode.WebviewViewProvider {
    private static context: vscode.ExtensionContext
    private suggestion: Suggestion
    private webView: vscode.Webview | undefined

    // singleton pattern
    private static instance: NewDetailViewProvider | undefined

    public static getInstance(
        context: vscode.ExtensionContext,
        suggestion: Suggestion
    ): NewDetailViewProvider {
        NewDetailViewProvider.context = context
        if (!NewDetailViewProvider.instance) {
            NewDetailViewProvider.instance = new NewDetailViewProvider(
                suggestion
            )
            vscode.window.registerWebviewViewProvider(
                'detail-view',
                NewDetailViewProvider.instance
            )
        } else {
            NewDetailViewProvider.instance.setOrReplaceSuggestion(suggestion)
        }
        return NewDetailViewProvider.instance
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
                this.suggestion,
                undefined,
                4
            )
            this.webView.html = `<pre>${suggestionString}</pre>`
        }
    }
}
