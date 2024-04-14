import { Button, provideVSCodeDesignSystem } from '@vscode/webview-ui-toolkit'

provideVSCodeDesignSystem()
    .register
    // // IMPORTANT: register components here, otherwise they will not be available in the webview!
    // vsCodeButton(),
    // vsCodePanels(),
    // vsCodePanelTab(),
    // vsCodePanelView()
    ()

const vscode = acquireVsCodeApi()

// upon loading the webview, the main function is called, which can be used to set up the webview
window.addEventListener('load', main)

// messages from the extension to the webview are handled here
window.addEventListener('message', (event) => {
    switch (event.data.command) {
        case 'addLogLine':
            document.getElementById(
                'logLines'
            ).innerHTML += `${event.data.text}`
            break
        // case "...":
        // // handle other messages from the extensions here
    }
})

function main() {
    // // assuming there is a button in the webview with the id 'THE_BUTTON',
    // // you can do the following:
    // const howdyButton = document.getElementById('THE_BUTTON') as Button
    // howdyButton?.addEventListener('click', handleButtonClickCreateFileMapping)
}

function handleButtonClickCreateFileMapping(this: Button) {
    // vscode.postMessage({
    //     command: 'hello',
    //     text: 'Hello from the webview!',
    // })
}
