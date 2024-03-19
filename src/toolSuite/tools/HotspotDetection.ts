import { CancelToken } from '../../utils/cancellation/CancelToken'
import { CommandExecution } from '../../utils/CommandExecution'

export class HotspotDetection {
    public constructor() {}

    public async run(
        dotDiscopop: string,
        cancelToken: CancelToken,
        overrideHotspotDetectionArguments?: string,
        stdoutCallback?: (data: string) => void,
        stderrCallback?: (data: string) => void
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
            cwd: dotDiscopop,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
            stdoutCallback: stdoutCallback,
            stderrCallback: stderrCallback,
        })
    }
}
