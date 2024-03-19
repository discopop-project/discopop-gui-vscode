import { stdout } from 'process'
import { CancelToken } from '../../utils/cancellation/CancelToken'
import { CommandExecution } from '../../utils/CommandExecution'

export class DiscoPoPPatchGenerator {
    public constructor() {}

    public async createDefaultPatches(
        dotDiscopop: string,
        cancelToken?: CancelToken,
        stdoutCallback?: (data: string) => void,
        stderrCallback?: (data: string) => void
    ): Promise<void> {
        await CommandExecution.commandExists(
            'discopop_patch_generator',
            true,
            'Is DiscoPoP installed?'
        )
        const execResult = await CommandExecution.execute({
            command: `discopop_patch_generator`,
            cwd: dotDiscopop,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
            stdoutCallback: stdoutCallback,
            stderrCallback: stderrCallback,
        })
        // console.log(execResult.stdout)
        // console.log(execResult.stderr)
    }

    /** requires the optimizer to be run first! */
    public async createOptimizedPatches(
        dotDiscopop: string,
        cancelToken?: CancelToken,
        stdoutCallback?: (data: string) => void,
        stderrCallback?: (data: string) => void
    ): Promise<void> {
        await CommandExecution.commandExists(
            'discopop_patch_generator',
            true,
            'Is DiscoPoP installed?'
        )
        const execResult = await CommandExecution.execute({
            command: `discopop_patch_generator -a ${dotDiscopop}/optimizer/patterns.json`,
            cwd: dotDiscopop,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
            stdoutCallback: stdoutCallback,
            stderrCallback: stderrCallback,
        })
        // console.log(execResult.stdout)
        // console.log(execResult.stderr)
    }
}
