import * as vscode from 'vscode'

export class LogPanel {
    public static panel: LogPanel | undefined
    private readonly _panel: vscode.WebviewPanel
    private _disposables: vscode.Disposable[] = []

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables)
        this._panel.webview.html = this._getWebviewContent()
    }

    public static render() {
        if (LogPanel.panel) {
            LogPanel.panel._panel.reveal(vscode.ViewColumn.One) // TODO put it down into the terminal area
        } else {
            const panel = vscode.window.createWebviewPanel(
                'log',
                'DiscoPoP Log',
                vscode.ViewColumn.One,
                {
                    //
                }
            )
            LogPanel.panel = new LogPanel(panel)
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

    private _getWebviewContent() {
        return `
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
            </body>
        </html>
        `
    }
}
