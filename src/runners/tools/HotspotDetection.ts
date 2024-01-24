import { CommandExecution } from '../helpers/CommandExecution'
import { CancelToken } from '../helpers/cancellation/CancelToken'

export class HotspotDetection {
    public constructor(public readonly dotDiscoPoP: string) {}

    public async run(cancelToken: CancelToken): Promise<void> {
        await CommandExecution.commandExists(
            'hotspot_analyzer',
            true,
            'Is Hotspot Detection installed?'
        )
        await CommandExecution.execute({
            command: `hotspot_analyzer`,
            cwd: this.dotDiscoPoP,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
        })
    }
}
