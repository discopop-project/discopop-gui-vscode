import { exec } from 'child_process'

export abstract class PatchApplicator {
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
    ): Promise<number> {
        const args = `-a ${id}`
        return this._runPatchApplicator(dotDiscoPoP, args)
    }

    public static async rollbackPatch(
        dotDiscoPoP: string,
        id: number
    ): Promise<number> {
        const args = `-r ${id}`
        return this._runPatchApplicator(dotDiscoPoP, args)
    }

    public static async clear(dotDiscoPoP: string): Promise<number> {
        const args = '-C'
        return this._runPatchApplicator(dotDiscoPoP, args)
    }

    private static async _runPatchApplicator(
        dotDiscoPoP: string,
        args: string
    ): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            exec(
                `discopop_patch_applicator ${args}`,
                { cwd: dotDiscoPoP },
                (err, stdout, stderr) => {
                    if (err) {
                        switch (err.code) {
                            case 0:
                            case 1:
                            case 2:
                            case 3:
                            default:
                                console.log(
                                    'patch applicator returned:' + err.code
                                )
                        }
                        reject(err)
                    } else {
                        resolve(err.code)
                    }
                }
            )
        })
    }

    // TODO provide interface for the other options of the patch_applicator
    // clear, rollback, load, list, ...

    // TODO allow passing multiple ids to apply/rollback
}
