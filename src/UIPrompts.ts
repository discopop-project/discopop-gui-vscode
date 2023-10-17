import * as vscode from 'vscode'

export class UIPrompts {
    // TODO add option for default values

    static async genericInputBoxQuery(
        title: string,
        prompt: string,
        step: number,
        totalSteps: number
    ): Promise<string> {
        const inputBox: vscode.InputBox = vscode.window.createInputBox()

        inputBox.title = title
        inputBox.prompt = prompt
        inputBox.step = step
        inputBox.totalSteps = totalSteps

        inputBox.ignoreFocusOut = true
        inputBox.onDidHide(() => inputBox.dispose())
        inputBox.show()
        return new Promise((resolve, reject) => {
            inputBox.onDidAccept(() => {
                if (!inputBox) {
                    reject()
                }
                resolve(inputBox.value)
                inputBox.hide()
            })
        })
    }

    static async genericOpenDialogQuery(
        title: string,
        prompt: string,
        step: number,
        totalSteps: number
    ): Promise<string> {
        const options: vscode.OpenDialogOptions = {
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: prompt, // bug in vs code api? this is not displayed, therefore also added to title
            title: `${title} (${step}/${totalSteps}): (${prompt})`,
        }
        const projectDirectoryUri = await vscode.window.showOpenDialog(options)
        if (!projectDirectoryUri || projectDirectoryUri.length === 0) {
            vscode.window.showErrorMessage(
                `No ${prompt} was selected! Aborting...`
            )
            throw new Error(`No ${prompt} was selected`)
        }
        return projectDirectoryUri[0].fsPath
    }

    // request confirmation with a modal dialog
    // make sure to await this function!!!
    static async actionConfirmed(prompt: string): Promise<boolean> {
        const answer = await vscode.window.showWarningMessage(
            prompt,
            { modal: true },
            'Yes',
            'No'
        )
        return answer === 'Yes'
    }
}
