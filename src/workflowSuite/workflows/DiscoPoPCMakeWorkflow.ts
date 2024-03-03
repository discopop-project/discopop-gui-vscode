import * as fs from 'fs'

import { ToolSuite } from '../../toolSuite/ToolSuite'
import { CancelToken } from '../../utils/cancellation/CancelToken'
import { CancellationError } from '../../utils/cancellation/CancellationError'

export class DiscoPoPCMakeWorkflow {
    public constructor() {}

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
        cancelToken: CancelToken,
        skipConfirmation: boolean,
        srcDirectory: string,
        executableName: string,
        executableArguments: string = '',
        dotDiscopop: string = srcDirectory + 'build/.discopop',
        buildDirectory: string = srcDirectory + '/build/DiscoPoP',
        buildArguments: string = '',
        overrideExplorerArguments?: string
    ): Promise<void> {
        const toolSuite = new ToolSuite()
        const instrumentation = toolSuite.discopopCMakeInstrumentation
        const explorer = toolSuite.discopopExplorer
        const patchGenerator = toolSuite.discopopPatchGenerator

        // make sure we have a clean build directory
        reportMessage('Preparing...', 0)
        if (
            fs.existsSync(buildDirectory) &&
            !(
                skipConfirmation ||
                (await requestConfirmation(
                    'The build directory already exists. Do you want to overwrite it?\n(You can disable this dialog in the extension settings)'
                ))
            )
        ) {
            throw new CancellationError(
                'The execution was cancelled and the build directory was not overwritten'
            )
        }
        instrumentation.prepareBuildDirectory(dotDiscopop, buildDirectory)
        reportProgress(10)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running CMake...', 0)
        await instrumentation.runCmake(
            buildArguments,
            srcDirectory,
            buildDirectory,
            cancelToken
        )
        reportProgress(10)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running Make...', 0)
        await instrumentation.runMake(dotDiscopop, buildDirectory, cancelToken)
        reportProgress(10)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running Instrumented Executable...', 0)
        await instrumentation.runInstrumentation(
            dotDiscopop,
            executableName,
            [executableArguments],
            buildDirectory,
            cancelToken
        )
        reportProgress(30)
        this.throwUponCancellation(cancelToken)

        reportMessage('Running Pattern Detection...', 0)
        await explorer.run(dotDiscopop, cancelToken, overrideExplorerArguments)
        reportProgress(30)
        this.throwUponCancellation(cancelToken)

        reportMessage('Generating Patches...', 0)
        await patchGenerator.createDefaultPatches(dotDiscopop, cancelToken)
        reportProgress(10)
    }

    private throwUponCancellation(cancelToken: CancelToken): void {
        if (cancelToken.isCancelled) {
            throw new CancellationError('Operation was cancelled')
        }
    }
}
