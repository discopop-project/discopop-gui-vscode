import { CancelToken } from '../helpers/cancellation/CancelToken'
import { CommandExecution } from '../helpers/CommandExecution'

export class DiscoPoPPatchGenerator {
    public constructor(public readonly dotDiscoPoP: string) {}

    public async createDefaultPatches(
        cancelToken?: CancelToken
    ): Promise<void> {
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
        await CommandExecution.execute({
            command: `discopop_patch_generator -a ${this.dotDiscoPoP}/optimizer/patterns.json`,
            cwd: this.dotDiscoPoP,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
        })
    }
}
