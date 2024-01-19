import * as fs from 'fs'
import { ToolSuite } from '../tools/ToolSuite'
import { CancellationError } from '../helpers/cancellation/CancellationError'
import { CancelToken } from '../helpers/cancellation/CancelToken'
import { Config } from '../../utils/Config'
import { CMakeBasedInstrumentation } from '../instrumentation/CMakeBasedInstrumentation'
import { HotspotDetectionProfilingWrapperInfo } from '../instrumentation/HotspotDetectionProfilingWrapperInfo'
import { HotspotDetectionParser } from '../../hotspotDetection/HotspotDetectionParser'
import { HotspotDetectionResults } from '../../hotspotDetection/classes/HotspotDetectionResults'

export class HotspotDetectionCMakeWorkflow {
    /**
     *
     * @param srcDirectory
     * @param executableName
     * @param executableArguments
     * @param buildDirectory defaults to <projectDirectory>/build/HotspotDetection
     * @param dotDiscoPoP defaults to <projectDirectory>/build/.discopop
     */
    public constructor(
        public readonly srcDirectory: string,
        public readonly executableName: string,
        public readonly executableArguments: string[],
        public readonly dotDiscoPoP: string = srcDirectory + 'build/.discopop',
        public readonly buildDirectory: string = srcDirectory +
            '/build/HotspotDetection'
    ) {}

    /**
     * runs the entire cmake workflow.
     * @param reportMessage report a message to the user, the optional nesting parameter can be used to indicate that a message is related to a subtask of a previous message
     * @param reportProgress report the current progress of the operation, the progress parameter should be a number between 0 and 100 and indicates the progress made since the last call to reportProgress.
     * @param requestConfirmation a callback that can be used to request confirmation from the user
     * @param cancelToken a token that can be used to cancel the operation from the outside
     * @returns the parsed DiscoPoP results
     */
    public async run(
        reportMessage: (message: string, nesting: number) => void,
        reportProgress: (progress: number) => void,
        requestConfirmation: (message: string) => Promise<boolean>,
        cancelToken: CancelToken
    ): Promise<HotspotDetectionResults> {
        const dpRunner = new ToolSuite(this.dotDiscoPoP)
        const instrumentation = new CMakeBasedInstrumentation(
            this.dotDiscoPoP,
            new HotspotDetectionProfilingWrapperInfo(),
            {
                srcDirectory: this.srcDirectory,
                executableName: this.executableName,
                executableArguments: this.executableArguments,
                buildDirectory: this.buildDirectory,
            }
        )

        // make sure we have a clean build directory
        reportMessage('Preparing...', 0)
        if (
            fs.existsSync(this.buildDirectory) &&
            !(
                Config.skipOverwriteConfirmation() ||
                (await requestConfirmation(
                    'The build directory already exists. Do you want to overwrite it?\n(You can disable this dialog in the extension settings)'
                ))
            )
        ) {
            throw new CancellationError(
                'The execution was cancelled and the build directory was not overwritten'
            )
        }
        instrumentation.prepareBuildDirectory()
        reportProgress(5)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running CMake...', 0)
        await instrumentation.runCmake(cancelToken)
        reportProgress(10)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running Make...', 0)
        await instrumentation.runMake(cancelToken)
        reportProgress(10)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running Instrumented Executable...', 0)
        await instrumentation.runInstrumentation(cancelToken)
        reportProgress(30)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running Hotspot Analysis...', 0)
        await dpRunner.hotspotDetection.run(cancelToken) // TODO allow additional arguments?
        reportProgress(30)
        this.throwUponCancellation(cancelToken)

        reportMessage('Parsing Results...', 0)
        const results = await HotspotDetectionParser.parse(this.dotDiscoPoP) // does not support cancellation
        reportProgress(5)

        return results
    }

    private throwUponCancellation(cancelToken: CancelToken): void {
        if (cancelToken.isCancelled) {
            throw new CancellationError('Operation was cancelled')
        }
    }
}