import * as vscode from 'vscode'

export class JSONWebViewProvider<T extends Object>
    implements vscode.WebviewViewProvider
{
    private webViewView: vscode.WebviewView | undefined
    private disposable: vscode.Disposable | undefined

    public constructor(
        private json: T | undefined,
        private placeholder: string
    ) {
        this._updateContents() // TODO can we remove this?
    }

    public register(viewId: string) {
        this.disposable = vscode.window.registerWebviewViewProvider(
            viewId,
            this
        )
    }

    public unregister() {
        this.disposable?.dispose()
    }

    public replaceContents(json: T | undefined) {
        this.json = json
        this._updateContents()
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext<unknown>,
        token: vscode.CancellationToken
    ): void | Thenable<void> {
        this.webViewView = webviewView // save the webview for later updates
        this._updateContents()
    }

    private _updateContents(): void {
        if (this.webViewView) {
            // if no suggestion is selected, provide a placeholder text
            if (!this.json) {
                this.webViewView.webview.html = this.placeholder
            } else {
                const suggestionString = JSON.stringify(this.json, undefined, 4)
                this.webViewView.webview.html = `<pre>${suggestionString}</pre>`
            }
        }
    }
}
