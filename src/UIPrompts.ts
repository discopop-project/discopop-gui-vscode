import * as vscode from 'vscode'

export class UIPrompts {
    // TODO add option for default values
    // TODO we should probably completely redo inputs...
    //  --> this could be a good starting point: https://github.com/microsoft/vscode-extension-samples/blob/main/quickinput-sample/src/quickOpen.ts
    static async genericInputBoxQuery(
        title: string,
        prompt: string,
        step: number,
        totalSteps: number,
        allowEmptyString: boolean = true
    ): Promise<string> {
        const inputBox: vscode.InputBox = vscode.window.createInputBox()

        inputBox.title = title
        inputBox.prompt = prompt
        inputBox.step = step
        inputBox.totalSteps = totalSteps

        inputBox.ignoreFocusOut = true
        inputBox.value = ''
        inputBox.onDidHide(() => inputBox.dispose())
        inputBox.show()
        return new Promise((resolve, reject) => {
            inputBox.onDidAccept(() => {
                // TODO can we differentiate between abort and empty string?
                // issue: onDidAccept is not called during abort?
                // this seems nice: https://github.com/microsoft/vscode-extension-samples/blob/main/quickinput-sample/preview.gif
                // if(inputBox.value === undefined){
                //     console.log("generic input box value was undefined")
                // }
                // else if(inputBox.value === null){
                //     console.log("generic input box value was null")
                // }
                // else if(inputBox.value === ""){
                //     console.log("generic input box value was empty string")
                // }
                // else{
                //     console.log("generic input box value was: " + inputBox.value)
                // }
                if (inputBox.value === undefined) {
                    reject(undefined)
                }
                if (!allowEmptyString && inputBox.value === '') {
                    reject('')
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
            vscode.window.showErrorMessage(`No selection was made! Aborting...`)
            throw new Error(`No selection was made!`)
        }
        return projectDirectoryUri[0].fsPath
    }

    /**
     * Request explicit confirmation from the user with a modal dialog. \
     * Remember to await this function!! e.g.: \
     * `if(await UIPrompts.actionConfirmed("Are you sure?") {doStuff()}`
     *
     * @param prompt the prompt to display to the user
     * @returns true if the user confirmed, false otherwise
     */
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
