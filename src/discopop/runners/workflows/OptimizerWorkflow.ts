import { CancelToken } from '../../../utils/cancellation/CancelToken'
import { ToolSuite } from '../tools/ToolSuite'

export class OptimizerWorkflow {
    public constructor(public readonly dotDiscoPoP: string) {}

    public async run(
        reportMessage: (message: string, nesting: number) => void,
        reportProgress: (progress: number) => void,
        cancelToken: CancelToken,
        overrideOptionsString?: string
    ): Promise<void> {
        const toolSuite = new ToolSuite(this.dotDiscoPoP)

        reportMessage('Running Optimizer...', 0)
        await toolSuite.discopopOptimizer.run(
            overrideOptionsString,
            cancelToken
        )
        reportProgress(80)

        reportMessage('Creating Optimized Patches...', 0)
        await toolSuite.discopopPatchGenerator.createOptimizedPatches(
            cancelToken
        )
        reportProgress(20)
    }
}
