import * as vscode from 'vscode'

export default (error: unknown) => {
    console.log(error)
    if (error instanceof Error) {
        vscode.window.showErrorMessage(error.message)
    } else {
        vscode.window.showErrorMessage(' An unknown error occurred.')
    }
}
