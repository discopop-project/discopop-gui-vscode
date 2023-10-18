import * as vscode from 'vscode'
import { Suggestion } from './SuggestionTreeView/SuggestionTreeDataProvider'

export class NewDetailViewProvider implements vscode.WebviewViewProvider {
    private static context: vscode.ExtensionContext
    private suggestion: Suggestion
    private webView: vscode.Webview | undefined

    // singleton
    private static instance: NewDetailViewProvider | undefined

    public static getInstance(
        context: vscode.ExtensionContext,
        suggestion: Suggestion
    ): NewDetailViewProvider {
        if (!NewDetailViewProvider.instance) {
            NewDetailViewProvider.instance = new NewDetailViewProvider(
                context,
                suggestion
            )
            vscode.window.registerWebviewViewProvider(
                'detail-view',
                this.instance
            )
        } else {
            NewDetailViewProvider.instance.updateWebView(context, suggestion)
        }
        return NewDetailViewProvider.instance
    }

    private constructor(
        context: vscode.ExtensionContext,
        suggestion: Suggestion
    ) {
        this.updateWebView(context, suggestion)
    }

    private updateWebView(
        context: vscode.ExtensionContext,
        suggestion: Suggestion
    ) {
        NewDetailViewProvider.context = context
        this.suggestion = suggestion
        if (this.webView) {
            this.webView.html = this._getHTML(this.suggestion)
        } else {
            console.error(
                'Webview not initialized, cannot show suggestion details'
            )
        }
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext<unknown>,
        token: vscode.CancellationToken
    ): void | Thenable<void> {
        this.webView = webviewView.webview // save the webview for later updates
        this.updateWebView(NewDetailViewProvider.context, this.suggestion)
    }

    private _getHTML(suggestion: Suggestion): string {
        // stringify the suggestion
        const suggestionString = JSON.stringify(this.suggestion, undefined, 4)
        // return the HTML string
        return `<pre>${suggestionString}</pre>`
    }
}
