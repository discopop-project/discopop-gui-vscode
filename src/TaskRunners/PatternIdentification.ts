import * as vscode from 'vscode'
import { Config } from '../Config'
import { exec } from 'child_process'
import { TaskExecuter } from './TaskExecuter'
import mkdirp = require('mkdirp')
import Utils from '../Utils'
import { StateManager } from '../misc/StateManager'

export class PatternIdentification extends TaskExecuter {
    constructor(context: vscode.ExtensionContext, onDone?: Function) {
        super(context, onDone)
    }

    getOptions() {
        const options = {
            cwd: Config.discopopRoot,
        }
        return options
    }

    async exportDPInstall(): Promise<void> {
        const command = `export DISCOPOP_INSTALL=${Config.discopopBuild}`
        await new Promise<void>((resolve, reject) => {
            exec(command, this.getOptions(), (err) => {
                if (err) {
                    console.log(`error: ${err.message}`)
                    vscode.window.showErrorMessage(
                        `Pattern Identification failed with error message ${err.message}`
                    )
                    reject()
                    return
                }
                resolve()
            })
        })
    }

    async executeDefault(): Promise<void> {
        const options = this.getOptions()

        await mkdirp(options.cwd)

        await this.exportDPInstall()

        const cwd = Utils.getCWD(this.context)
        // mv $HOME_DIR/discopop/$bin_dir/dp_run_dep.txt $HOME_DIR/discopop/
        // mv $HOME_DIR/FileMapping.txt $HOME_DIR/discopop/
        // python3 -m discopop_explorer --path=<path> --cu-xml=<cuxml> --dep-file=<depfile> --loop-counter=<loopcount> --reduction=<reduction> --generate-data-cu-inst=<outputdir>
        const command1 = `python3 -m discopop_explorer --path=${cwd} --cu-xml=${cwd}/Data.xml --dep-file=${cwd}/dp_run_dep.txt --reduction=${cwd}/reduction.txt`

        console.log(command1)
        await new Promise<void>((resolve) => {
            console.log('Starting PatternIdentification')
            console.log(options.cwd)
            exec(command1, options, (err, stdout, stderr) => {
                // ignore for now because of some weird display error
                /* if (stderr) {
                    console.log(`error: ${stderr}`);
                    resolve()
                    return;
                } */

                console.log('PatternIdentification Done!')

                if (stdout) {
                    const stateManager = new StateManager(this.context)
                    stateManager.save('explorerResult', stdout)
                    console.log(stdout)
                }

                vscode.window.showInformationMessage(
                    'Pattern Identification done!'
                )

                resolve()
            })
        })
    }

    executeMakefile() {}
}
