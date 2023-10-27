import * as vscode from 'vscode'

/**
 * Returns a function that can be used as an error handler.
 * @param message The message to be shown to the user
 */
export function getDefaultErrorHandler(
    message: string
): (error: unknown) => void {
    const errorHandler = (error: unknown) => {
        console.log(message)
        if (error instanceof Error) {
            console.log(error.message)
            console.log(error.stack)
            vscode.window.showErrorMessage(message + error.message)
        } else {
            console.log(error)
            vscode.window.showErrorMessage(
                message + ' An unknown error occurred.'
            )
        }
    }
    // TODO should we do some cleanup here? But then again the user might want to see the results...

    return errorHandler
}
