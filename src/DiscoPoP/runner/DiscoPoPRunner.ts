import { exec } from 'child_process'
import { Config } from '../../Utils/Config'
import { DiscoPoPResults } from '../classes/DiscoPoPResults'
import { DiscoPoPParser } from '../DiscoPoPParser'
import { CancelToken } from '../../Utils/CancelToken'

/** provides functions to run the DiscoPoP tools */
export class DiscoPoPRunner {
    public constructor(public readonly dotDiscoPoP: string) {}

    public get discopopVersion(): string {
        throw new Error('not implemented yet') // TODO
    }

    public get discopopBuild(): string {
        return Config.discopopBuild() // TODO replace with discopop_config_provider
    }

    public async runExplorer(cancelToken: CancelToken): Promise<void> {
        let outerResolve: () => void
        return new Promise<void>((resolve, reject) => {
            outerResolve = resolve
            const childProcess = exec(
                `discopop_explorer`,
                {
                    cwd: this.dotDiscoPoP,
                },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                'discopop_explorer failed: ' + err.message
                            )
                        )
                    } else {
                        resolve()
                    }
                }
            )
            cancelToken.emitter.on('cancel', async () => {
                console.log(
                    'DiscoPoPRunner::cancellation requested::discopop_explorer'
                )
                childProcess.kill() // SIGINT or SIGTERM?
                outerResolve?.()
            })
        })
    }
    public async runPatchGenerator(cancelToken: CancelToken): Promise<void> {
        let outerResolve: () => void
        return new Promise<void>((resolve, reject) => {
            outerResolve = resolve
            const childProcess = exec(
                `discopop_patch_generator`,
                {
                    cwd: this.dotDiscoPoP,
                },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                'discopop_patch_generator failed: ' +
                                    err.message +
                                    '\n' +
                                    stderr
                            )
                        )
                    } else {
                        resolve()
                    }
                }
            )
            cancelToken.emitter.on('cancel', async () => {
                console.log(
                    'DiscoPoPRunner::cancellation requested::discopop_patch_generator'
                )
                childProcess.kill() // SIGINT or SIGTERM?
                outerResolve?.()
            })
        })
    }
    public async optimize(): Promise<void> {}

    private async _runPatchApplicator(args: string): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            exec(
                `discopop_patch_applicator ${args}`,
                { cwd: this.dotDiscoPoP },
                (err, stdout, stderr) => {
                    if (err) {
                        switch (err.code) {
                            case 3: // "3: Nothing to roll back, trivially successful"
                                resolve(err.code)
                                return
                            case 0: // "0: Applied successfully"
                                resolve(err.code)
                                return
                            case 1:
                                '1: Nothing applied, error'
                            // fallthrough
                            case 2: // "2: Some changes applied successfully"
                            // fallthrough
                            default:
                                console.log(
                                    'patch applicator returned:' + err.code
                                )
                                reject(err)
                                return
                        }
                    } else {
                        resolve(err.code)
                    }
                    return
                }
            )
        })
    }

    public async patchApply(...id: number[]): Promise<number> {
        const args = `-a ${id.join(' ')}`
        return this._runPatchApplicator(args)
    }

    public async patchRollback(...id: number[]): Promise<number> {
        const args = `-r ${id.join(' ')}`
        return this._runPatchApplicator(args)
    }

    public async patchClear(): Promise<number> {
        const args = '-C'
        return this._runPatchApplicator(args)
    }

    public async parse(): Promise<DiscoPoPResults> {
        return DiscoPoPParser.parse(this.dotDiscoPoP)
    }
}
