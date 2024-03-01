// TODO make sure we handle all error codes correctly!!!

import { CommandExecution } from '../../utils/CommandExecution'

export class DiscoPoPPatchApplicator {
    public constructor() {}

    private async _runPatchApplicator(
        dotDiscopop: string,
        args: string
    ): Promise<number> {
        await CommandExecution.commandExists(
            'discopop_patch_applicator',
            true,
            'Is DiscoPoP installed?'
        )
        try {
            const executionResult = CommandExecution.execute({
                command: `discopop_patch_applicator ${args}`,
                cwd: dotDiscopop,
                throwOnNonZeroExitCode: true,
            })
            return (await executionResult).exitCode
        } catch (error: any) {
            if (error.code) {
                console.error(
                    `DiscoPoPPatchApplicator: error code ${error.code}`
                )
                return error.code
            } else {
                throw error
            }
        }
    }

    public async patchApply(
        dotDiscopop: string,
        ...id: number[]
    ): Promise<number> {
        const args = `-a ${id.join(' ')}`
        return this._runPatchApplicator(dotDiscopop, args)
    }

    public async patchRollback(
        dotDiscopop: string,
        ...id: number[]
    ): Promise<number> {
        const args = `-r ${id.join(' ')}`
        return this._runPatchApplicator(dotDiscopop, args)
    }

    public async patchClear(dotDiscopop: string): Promise<number> {
        const args = '-C'
        return this._runPatchApplicator(dotDiscopop, args)
    }
}
