import { exec } from 'child_process'

export abstract class PatchManager {
    private constructor() {
        throw new Error(
            'PatchManager is a static class and cannot be instantiated.'
        )
    }

    /**
     *
     * @param id the id of the suggestion to be applied
     * @param dotDiscoPoP the path the the .discopop directory
     */
    public static async applyPatch(
        dotDiscoPoP: string,
        id: number
    ): Promise<void> {
        const args = `-a ${id}`
        return this._runPatchApplicator(dotDiscoPoP, args)
    }

    public static async rollbackPatch(
        dotDiscoPoP: string,
        id: number
    ): Promise<void> {
        const args = `-r ${id}`
        return this._runPatchApplicator(dotDiscoPoP, args)
    }

    public static async clear(dotDiscoPoP: string): Promise<void> {
        const args = '-C'
        return this._runPatchApplicator(dotDiscoPoP, args)
    }

    private static async _runPatchApplicator(
        dotDiscoPoP: string,
        args: string
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!dotDiscoPoP) {
                reject(
                    new Error(
                        'discopop_patch_applicator called while .discopop directory is not set.'
                    )
                )
                return
            }
            exec(
                `discopop_patch_applicator ${args}`,
                { cwd: dotDiscoPoP },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                'discopop_patch_applicator failed: ' +
                                    err.message +
                                    '\n' +
                                    stderr +
                                    stdout
                            )
                        )
                    }
                    // TODO this should be indicated by the exit code in the future...
                    else if (stdout.includes('not successful.')) {
                        reject(
                            new Error(
                                'discopop_patch_applicator failed: ' + stdout
                            )
                        )
                    } else {
                        resolve()
                    }
                }
            )
        })
    }

    // TODO provide interface for the other options of the patch_applicator
    // clear, rollback, load, list, ...

    // TODO allow passing multiple ids to apply/rollback
}
