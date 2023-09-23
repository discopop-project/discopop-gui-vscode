// @ts-nocheck

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    const oldState = vscode.getState() || {};

    document.querySelector('.execute-filemapping').addEventListener('click', () => {
        onExecuteFilemappingClicked();
    });

    document.querySelector('.execute-cugen').addEventListener('click', () => {
        onExecuteCUGenClicked();
    });

    document.querySelector('.execute-depprof').addEventListener('click', () => {
        onExecuteDepProf();
    });

    document.querySelector('.execute-redop').addEventListener('click', () => {
        onExecuteRedOp();
    });

    document.querySelector('.execute-patternid').addEventListener('click', () => {
        onExecutePatternId();
    });

    document.querySelector('.execute-all').addEventListener('click', () => {
        onExecuteAll();
    });

    document.querySelector('.execute-all-new').addEventListener('click', () => {
        onExecuteAllNew();
    });

    document.querySelector('.execute-script').addEventListener('click', () => {
        onExecuteScript();
    })

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'executionDone':
                {
                    showDone();
                    break;
                }

        }
    });

    function onExecuteFilemappingClicked() {
        vscode.postMessage({type: 'executeFilemapping'});
    }

    function onExecuteCUGenClicked() {
        vscode.postMessage({type: 'executeCUGen'});
    }

    function onExecuteDepProf() {
        vscode.postMessage({type: 'executeDepProf'})
    }

    function onExecuteRedOp() {
        vscode.postMessage({type: 'executeRedOp'})
    }

    function onExecutePatternId() {
        vscode.postMessage({type: 'executePatternId'})
    }

    function onExecuteAll() {
        vscode.postMessage({type: 'executeAll'})
    }

    function onExecuteAllNew() {
        vscode.postMessage({type: 'executeAllNew'})
    }

    function onExecuteScript() {
        vscode.postMessage({type: 'executeScript'})
    }

    function showDone() {
        console.log("Done")
    }
}());


