import { CancelToken } from '../../utils/cancellation/CancelToken'
import { CommandExecution } from '../../utils/CommandExecution'

export class DiscoPoPPatchGenerator {
    public constructor() {}

    public async createDefaultPatches(
        dotDiscopop: string,
        cancelToken?: CancelToken
    ): Promise<void> {
        await CommandExecution.commandExists(
            'discopop_patch_generator',
            true,
            'Is DiscoPoP installed?'
        )
        await CommandExecution.execute({
            command: `discopop_patch_generator`,
            cwd: dotDiscopop,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
        })
    }

    /** requires the optimizer to be run first! */
    public async createOptimizedPatches(
        dotDiscopop: string,
        cancelToken?: CancelToken
    ): Promise<void> {
        await CommandExecution.commandExists(
            'discopop_patch_generator',
            true,
            'Is DiscoPoP installed?'
        )
        await CommandExecution.execute({
            command: `discopop_patch_generator -a ${dotDiscopop}/optimizer/patterns.json`,
            cwd: dotDiscopop,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
        })
    }
}
