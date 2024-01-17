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

    public async parse(): Promise<DiscoPoPResults> {
        return DiscoPoPParser.parse(this.dotDiscoPoP)
    }

    public async runPatchApplicator(): Promise<void> {}
    public async runOptimizer(): Promise<void> {}
}
