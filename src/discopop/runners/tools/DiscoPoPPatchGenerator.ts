import { CommandExecution } from '../../../utils/CommandExecution'
import { CancelToken } from '../../../utils/cancellation/CancelToken'

export class DiscoPoPPatchGenerator {
    public constructor(public readonly dotDiscoPoP: string) {}

    public async createDefaultPatches(
        cancelToken?: CancelToken
    ): Promise<void> {
        await CommandExecution.commandExists(
            'discopop_patch_generator',
            true,
            'Is DiscoPoP installed?'
        )
        await CommandExecution.execute({
            command: `discopop_patch_generator`,
            cwd: this.dotDiscoPoP,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
        })
    }

    /** requires the optimizer to be run first! */
    public async createOptimizedPatches(
        cancelToken?: CancelToken
    ): Promise<void> {
        await CommandExecution.commandExists(
            'discopop_patch_generator',
            true,
            'Is DiscoPoP installed?'
        )
        await CommandExecution.execute({
            command: `discopop_patch_generator -a ${this.dotDiscoPoP}/optimizer/patterns.json`,
            cwd: this.dotDiscoPoP,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
        })
    }
}
