import * as fs from 'fs'
import { Config } from '../../../utils/Config'
import { CancelToken } from '../../../utils/cancellation/CancelToken'
import { CancellationError } from '../../../utils/cancellation/CancellationError'
import { ToolSuite } from '../tools/ToolSuite'

export class DiscoPoPCMakeWorkflow {
    /**
     *
     * @param srcDirectory
     * @param executableName
     * @param executableArguments defaults to ""
     * @param dotDiscoPoP defaults to <srcDirectory>/build/.discopop
     * @param buildDirectory defaults to <srcDirectory>/build/DiscoPoP
     */
    public constructor(
        public readonly srcDirectory: string,
        public readonly executableName: string,
        public readonly executableArguments: string = '',
        public readonly dotDiscoPoP: string = srcDirectory + 'build/.discopop',
        public readonly buildDirectory: string = srcDirectory +
            '/build/DiscoPoP',
        public readonly buildArguments: string = '',
        public readonly overrideExplorerArguments?: string
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
    ): Promise<void> {
        const toolSuite = new ToolSuite(this.dotDiscoPoP)
        const instrumentation = toolSuite.discopopCMakeInstrumentation

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
        instrumentation.prepareBuildDirectory(this.buildDirectory)
        reportProgress(10)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running CMake...', 0)
        await instrumentation.runCmake(
            this.buildArguments,
            this.srcDirectory,
            this.buildDirectory,
            cancelToken
        )
        reportProgress(10)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running Make...', 0)
        await instrumentation.runMake(this.buildDirectory, cancelToken)
        reportProgress(10)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running Instrumented Executable...', 0)
        await instrumentation.runInstrumentation(
            this.executableName,
            [this.executableArguments],
            this.buildDirectory,
            cancelToken
        )
        reportProgress(30)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running Pattern Detection...', 0)
        await toolSuite.discopopExplorer.run(
            cancelToken,
            this.overrideExplorerArguments
        ) // TODO allow additional arguments?
        reportProgress(30)
        this.throwUponCancellation(cancelToken)

        reportMessage('Generating Patches...', 0)
        await toolSuite.discopopPatchGenerator.createDefaultPatches(cancelToken)
        reportProgress(10)
    }

    private throwUponCancellation(cancelToken: CancelToken): void {
        if (cancelToken.isCancelled) {
            throw new CancellationError('Operation was cancelled')
        }
    }
}
