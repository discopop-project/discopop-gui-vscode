import { CancelToken } from '../helpers/cancellation/CancelToken'
import { CommandExecution } from '../helpers/CommandExecution'

export class DiscoPoPExplorer {
    public constructor(public readonly dotDiscoPoP: string) {}

    public async run(cancelToken?: CancelToken): Promise<void> {
        await CommandExecution.commandExists(
            'discopop_explorer',
            true,
            'Is DiscoPoP installed?'
        )
        await CommandExecution.execute({
            command: `discopop_explorer`,
            cwd: this.dotDiscoPoP,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
        })
    }
}
