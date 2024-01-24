import { CommandExecution } from '../helpers/CommandExecution'

// TODO make sure we handle all error codes correctly!!!

export class DiscoPoPPatchApplicator {
    public constructor(public readonly dotDiscoPoP: string) {}

    private async _runPatchApplicator(args: string): Promise<number> {
        await CommandExecution.commandExists(
            'discopop_patch_applicator',
            true,
            'Is DiscoPoP installed?'
        )
        try {
            const executionResult = CommandExecution.execute({
                command: `discopop_patch_applicator ${args}`,
                cwd: this.dotDiscoPoP,
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
}
