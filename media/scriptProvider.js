// @ts-nocheck

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
;(function () {
    const vscode = acquireVsCodeApi()

    const oldState = vscode.getState() || {}

    document.querySelector('.execute-script').addEventListener('click', () => {
        onExecuteScript()
    })

    document.querySelector('.parse-results').addEventListener('click', () => {
        onExecuteParseResults()
    })

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', (event) => {
        const message = event.data // The json data that the extension sent
        switch (message.type) {
            case 'executionDone': {
                showDone()
                break
            }
        }
    })

    function onExecuteScript() {
        vscode.postMessage({ type: 'executeScript' })
    }

    function onExecuteParseResults() {
        vscode.postMessage({ type: 'parseResults' })
    }

    function showDone() {
        console.log('Done')
    }
})()
