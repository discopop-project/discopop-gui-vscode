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
        id: string
    ): Promise<void> {
        // TODO allow passing multiple ids
        return new Promise<void>((resolve, reject) => {
            exec(
                `discopop_patch_applicator -a ${id}`,
                { cwd: dotDiscoPoP },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                'discopop_patch_applicator failed: ' +
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
        })
    }

    // TODO provide interface for the other options of the patch_applicator
    // clear, rollback, load, list, ...
}
