import * as vscode from 'vscode'
import * as fs from 'fs'
import { Config } from '../Config'
import { StorageManager } from '../misc/StorageManager'

import { exec } from 'child_process'
import { Commands } from '../Commands'

// saves files to hidden vscode storage
export class FileMapper {
    context: vscode.ExtensionContext
    onDone: Function | undefined

    constructor(
        context: vscode.ExtensionContext,
        onDone?: Function | undefined
    ) {
        this.context = context
        this.onDone = onDone
    }

    public async execute() {
        // check if dp-fmap script exists
        if (!fs.existsSync(Config.discopopFileMapper)) {
            vscode.window.showErrorMessage(
                'Error creating File Mapping: dp-fmap script not found!'
            )
            return
        }

        // run the filemapping script
        exec(
            Config.discopopFileMapper,
            {
                cwd: Config.getWorkspacePath(),
            },
            async (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(
                        'Error creating File Mapping: ' + error
                    )
                    console.log(`error: ${error.message}`)
                    return
                }

                vscode.commands.executeCommand(Commands.refreshFileMapping)

                vscode.window.showInformationMessage('File Mapping done!')
            }
        )

        if (this.onDone) {
            this.onDone()
        }

        return
    }
}
