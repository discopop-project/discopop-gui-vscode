import * as vscode from 'vscode'
import { getNonce } from './utils/getNonce'
import { getUri } from './utils/getUri'

export class LogPanel {
    public static panel: LogPanel | undefined
    private readonly _panel: vscode.WebviewPanel
    private _disposables: vscode.Disposable[] = []

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables)
        this._setWebviewMessageListener(this._panel.webview)
        this._panel.webview.html = this._getWebviewContent(
            this._panel.webview,
            extensionUri
        )
    }

    public static render(extensionUri: vscode.Uri) {
        if (LogPanel.panel) {
            LogPanel.panel._panel.reveal(vscode.ViewColumn.One) // TODO put it down into the terminal area
        } else {
            const panel = vscode.window.createWebviewPanel(
                'log',
                'DiscoPoP Log',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [
                        vscode.Uri.joinPath(extensionUri, 'out'),
                    ],
                }
            )
            LogPanel.panel = new LogPanel(panel, extensionUri)
        }
    }

    public dispose() {
        LogPanel.panel = undefined
        this._panel.dispose()
        while (this._disposables.length) {
            const x = this._disposables.pop()
            if (x) {
                x.dispose()
            }
        }
    }

    private _getWebviewContent(
        webview: vscode.Webview,
        extensionUri: vscode.Uri
    ) {
        const webviewUri = getUri(webview, extensionUri, ['out', 'webview.js'])
        const nonce = getNonce()
        return /*html*/ `
        <!DOCTYPE html>
        <html lang=en>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>DiscoPoP Log</title>
            </head>
            <body>
                <h1>DiscoPoP Log</h1>
                <p>Log content will be here</p>
                <vscode-button id="THE_BUTTON">Click me</vscode-button>
                <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
            </body>
        </html>
        `
    }

    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            (message: any) => {
                const command = message.command
                const text = message.text

                console.log(message)

                switch (command) {
                    case 'hello':
                        vscode.window.showInformationMessage(text)
                        return
                }
            },
            undefined,
            this._disposables
        )
    }
}
