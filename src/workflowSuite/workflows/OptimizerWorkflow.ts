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
        const toolSuite = new ToolSuite()
        const discopopOptimizer = toolSuite.discopopOptimizer
        const patchGenerator = toolSuite.discopopPatchGenerator

        reportMessage('Running Optimizer...', 0)
        await discopopOptimizer.run(
            dotDiscopop,
            overrideOptionsString,
            cancelToken
        )
        reportProgress(80)

        reportMessage('Creating Optimized Patches...', 0)
        await patchGenerator.createOptimizedPatches(dotDiscopop, cancelToken)
        reportProgress(20)
    }
}
