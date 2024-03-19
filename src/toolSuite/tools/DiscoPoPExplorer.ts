import { CancelToken } from '../../utils/cancellation/CancelToken'
import { CommandExecution } from '../../utils/CommandExecution'

export class DiscoPoPExplorer {
    public constructor() {}

    public async run(
        dotDiscoPoP: string,
        cancelToken?: CancelToken,
        overrideExplorerArguments?: string,
        stdoutCallback?: (data: string) => void,
        stderrCallback?: (data: string) => void
    ): Promise<void> {
        let command = 'discopop_explorer'

        // throw if discopop_explorer command does not exist
        await CommandExecution.commandExists(
            command,
            true, // throw
            'Is DiscoPoP installed?'
        )

        // ovveride options?
        if (overrideExplorerArguments) {
            command += ' ' + overrideExplorerArguments
        }

        // execute
        await CommandExecution.execute({
            command: command,
            cwd: dotDiscoPoP,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
            stdoutCallback: stdoutCallback,
            stderrCallback: stderrCallback,
        })
    }
}
