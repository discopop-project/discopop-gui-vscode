import * as vscode from 'vscode'
import * as fs from 'fs'
import { Config } from '../Config'
import { exec } from 'child_process'
import { TaskExecuter } from './TaskExecuter'
import { StateManager } from '../misc/StateManager'
import mkdirp = require('mkdirp')
import Utils from '../Utils'
import { TreeItem } from '../Provider/TreeDataProvider'
import { rejects } from 'assert'

export class CUGen extends TaskExecuter {
    constructor(context: vscode.ExtensionContext, onDone?: Function) {
        super(context, onDone)
    }

    clearDataXml(path): void {
        if (fs.existsSync(path)) {
            fs.unlinkSync(path)
        }
    }

    async executeDefault(): Promise<any> {
        const options = {
            cwd: Utils.getCWD(this.context),
        }

        await mkdirp(options.cwd)

        this.clearDataXml(`${options.cwd}/Data.xml`)

        const starterPromise = Promise.resolve(null)
        await this.files.reduce(
            (p, file) => p.then(() => this.runTask(file, options).then()),
            starterPromise
        )

        if (fs.existsSync(`${options.cwd}/Data.xml`)) {
            vscode.window.showInformationMessage('CUGen done for all files.')
        }
    }

    async runTask(file, options) {
        if (file.path.endsWith('.h')) {
            return
        }

        const executeString = `${Config.clang} -DUSE_MPI=Off -DUSE_OPENMP=Off -g -O0 -fno-discard-value-names -Xclang -load -Xclang ${Config.discopopBuild}/libi/LLVMCUGeneration.so -mllvm -fm-path -mllvm ./FileMapping.txt -o dp_cu_${file.name}.ll -c ${file.path}`
        console.log('Executing CU Gen')
        console.log(executeString)

        await new Promise<void>((resolve, reject) => {
            exec(executeString, options, (err, stdout, stderr) => {
                if (err) {
                    console.log(`error: ${err.message}`)
                    vscode.window.showErrorMessage(
                        `CU Generation failed with error message ${err.message}`
                    )
                    reject()
                    return
                }
                resolve()
            })
        })
    }

    executeMakefile() {
        throw new Error('Method not implemented.')
    }
}
