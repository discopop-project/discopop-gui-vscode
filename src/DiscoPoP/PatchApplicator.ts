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
        ...id: number[]
    ): Promise<number> {
        const args = `-a ${id.join(' ')}`
        return this._runPatchApplicator(dotDiscoPoP, args)
    }

    public static async rollbackPatch(
        dotDiscoPoP: string,
        ...id: number[]
    ): Promise<number> {
        const args = `-r ${id.join(' ')}`
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
}
