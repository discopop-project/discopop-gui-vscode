import * as vscode from 'vscode'

export class UserCancellationError extends Error {
    constructor(message?: string) {
        super(message)
    }

    public showErrorMessageNotification(timeout = 3000) {
        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: this.message,
                cancellable: false,
            },
            async (progress, token) => {
                progress.report({ increment: 100 })
                await new Promise((resolve) => setTimeout(resolve, timeout))
            }
        )
    }
}
