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

    private _logLines: string[] = []

    public addLogLine(line: string) {
        // store all log lines
        this._logLines.push(line)

        // if the panel is already created, update the content
        if (this._panel !== undefined) {
            this._panel.webview.postMessage({
                command: 'addLogLine',
                text: 'I heard you loud and clear! 🤠',
            })
        }
    }

    private _getLogLines() {
        return this._logLines.map((line) => `<li>${line}</li>`).join('') || ''
    }

    // TODO put it down into the terminal area
    public static render(extensionUri: vscode.Uri) {
        if (LogPanel.panel) {
            LogPanel.panel._panel.reveal(vscode.ViewColumn.One)
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

    // returns the HTML content for the webview
    // note: adding components (e.g. <vscode-button>) requires them to be registered!
    private _getWebviewContent(
        webview: vscode.Webview,
        extensionUri: vscode.Uri
    ) {
        const webviewUri = getUri(webview, extensionUri, ['out', 'webview.js'])
        const nonce = getNonce()
        // tip: you can get syntax highlighting in the following string by installing the es6-string-html extension
        return /*html*/ `
        <!DOCTYPE html>
        <html lang=en>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>DiscoPoP</title>
            </head>
            <body>
                <section>
                <vscode-panels>
                    <vscode-panel-tab id="log-tab">Log</vscode-panel-tab>
                    <vscode-panel-tab id="controls-tab">Controls</vscode-panel-tab>
                    <vscode-panel-tab id="suggestions-tab">Suggestions</vscode-panel-tab>
                    <vscode-panel-tab id="optimizer-tab">Interactive Optimizer</vscode-panel-tab>
                    <vscode-panel-view id="log-tab-view">
                        Log content will be Here
                        <ul id=logLines>${this._getLogLines()}</ul>
                    </vscode-panel-view>
                    <vscode-panel-view id="controls-tab-view">
                        <vscode-button id="THE_BUTTON">Create a FileMapping</vscode-button>
                        <vscode-button id="button-2">Run the explorer</vscode-button>
                        <vscode-button id="button-3">Run the optimizer</vscode-button>
                        <vscode-button id="button-4">Create an interactive export</vscode-button>
                        <vscode-button id="button-5">...</vscode-button>
                    </vscode-panel-view>
                    <vscode-panel-view id="suggestions-tab-view">
                        Suggestions will be Here
                    </vscode-panel-view>
                    <vscode-panel-view id="optimizer-tab-view">
                        Optimizer will be Here
                    </vscode-panel-view>
                </vscode-panels>
                </section>
                <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
            </body>
        </html>
        `
    }

    // messages from the webview to the extension are handled here
    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            (message: any) => {
                const command = message.command
                const text = message.text

                switch (command) {
                    case 'hello':
                        vscode.window.showInformationMessage(text)
                        this.addLogLine(text)
                        return
                }
            },
            undefined,
            this._disposables
        )
    }
}
