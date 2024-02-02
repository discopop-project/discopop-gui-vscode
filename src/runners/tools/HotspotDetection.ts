import { CommandExecution } from '../helpers/CommandExecution'
import { CancelToken } from '../helpers/cancellation/CancelToken'

export class HotspotDetection {
    public constructor(public readonly dotDiscoPoP: string) {}

    public async run(
        cancelToken: CancelToken,
        overrideHotspotDetectionArguments?: string
    ): Promise<void> {
        // Check if hotspot_analyzer is installed
        await CommandExecution.commandExists(
            'hotspot_analyzer',
            true,
            'Is Hotspot Detection installed?'
        )

        // build the command
        let command: string = `hotspot_analyzer`
        if (overrideHotspotDetectionArguments) {
            command += ` ${overrideHotspotDetectionArguments}`
        }

        // run
        await CommandExecution.execute({
            command: command,
            cwd: this.dotDiscoPoP,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
        })
    }
}
