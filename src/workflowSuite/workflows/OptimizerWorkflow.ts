import { ToolSuite } from '../../toolSuite/ToolSuite'
import { CancelToken } from '../../utils/cancellation/CancelToken'

export class OptimizerWorkflow {
    public constructor() {}

    public async run(
        reportMessage: (message: string, nesting: number) => void,
        reportProgress: (progress: number) => void,
        cancelToken: CancelToken,
        dotDiscopop: string,
        overrideOptionsString?: string
    ): Promise<void> {
        const logStdX = (data: string) => {
            reportMessage(data, 1)
        }

        reportMessage('Running Optimizer...', 0)
        await ToolSuite.discopopOptimizer.run(
            dotDiscopop,
            overrideOptionsString,
            cancelToken,
            logStdX,
            logStdX
        )
        reportProgress(80)

        reportMessage('Creating Optimized Patches...', 0)
        await ToolSuite.discopopPatchGenerator.createOptimizedPatches(
            dotDiscopop,
            cancelToken,
            logStdX,
            logStdX
        )
        reportProgress(20)
    }
}
