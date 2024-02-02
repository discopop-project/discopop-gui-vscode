import { CancelToken } from '../helpers/cancellation/CancelToken'
import { CommandExecution } from '../helpers/CommandExecution'

export class DiscoPoPExplorer {
    public constructor(public readonly dotDiscoPoP: string) {}

    public async run(
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
            cwd: this.dotDiscoPoP,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
        })
    }
}
