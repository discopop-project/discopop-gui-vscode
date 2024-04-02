import {
    Button,
    provideVSCodeDesignSystem,
    vsCodeButton,
    vsCodePanelTab,
    vsCodePanelView,
    vsCodePanels,
} from '@vscode/webview-ui-toolkit'

provideVSCodeDesignSystem().register(
    vsCodeButton(),
    vsCodePanels(),
    vsCodePanelTab(),
    vsCodePanelView()
)

const vscode = acquireVsCodeApi()

window.addEventListener('load', main)

// messages from the extension to the webview are handled here:
// my convention is to use the command property to determine the action,
// other properties are used for the data
window.addEventListener('message', (event) => {
    switch (event.data.command) {
        case 'addLogLine':
            document.getElementById(
                'logLines'
            ).innerHTML += `${event.data.text}`
            break
    }
})

function main() {
    // To get improved type annotations/IntelliSense the associated class for
    // a given toolkit component can be imported and used to type cast a reference
    // to the element (i.e. the `as Button` syntax)
    const howdyButton = document.getElementById('THE_BUTTON') as Button
    howdyButton?.addEventListener('click', handleButtonClickCreateFileMapping)
}

function handleButtonClickCreateFileMapping(this: Button) {
    vscode.postMessage({
        command: 'hello',
        text: 'Lets create a FileMapping! 🤠',
    })
}
