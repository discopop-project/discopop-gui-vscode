import * as vscode from 'vscode'

export abstract class UIPrompts {
    public static showMessageForSeconds(message: string, seconds: number = 4) {
        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: message,
                cancellable: false,
            },
            async (progress, token) => {
                const ms = seconds * 1000
                const interval = 100
                const reportedProgressPerInterval = 100 / (ms / interval)
                for (let i = 0; i < ms; i += interval) {
                    progress.report({ increment: reportedProgressPerInterval })
                    await new Promise((resolve) =>
                        setTimeout(resolve, interval)
                    )
                }
            }
        )
    }

    /**
     * Request explicit confirmation from the user with a modal dialog. \
     * Remember to await this function!! e.g.: \
     * `if(await UIPrompts.actionConfirmed("Are you sure?") {doStuff()}`
     *
     * @param message the prompt to display to the user
     * @returns true if the user confirmed, false otherwise
     */
    static async actionConfirmed(message: string): Promise<boolean> {
        const answer = await vscode.window.showWarningMessage(
            message,
            { modal: true },
            'Yes'
        )
        return answer === 'Yes'
    }
}
