import { CancelToken } from '../../utils/cancellation/CancelToken'
import { CommandExecution } from '../../utils/CommandExecution'

export class DiscoPoPExplorer {
    public constructor() {}

    public async run(
        dotDiscoPoP: string,
        cancelToken?: CancelToken,
        overrideExplorerArguments?: string
    ): Promise<void> {
        await CommandExecution.commandExists(
            'discopop_explorer',
            true,
            'Is DiscoPoP installed?'
        )
        let commandWithArgs = 'discopop_explorer'
        if (overrideExplorerArguments) {
            commandWithArgs += ' ' + overrideExplorerArguments
        }
        await CommandExecution.execute({
            command: commandWithArgs,
            cwd: dotDiscoPoP,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
        })
    }
}
