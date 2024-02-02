import { DiscoPoPParser } from '../../discoPoP/DiscoPoPParser'
import { DiscoPoPResults } from '../../discoPoP/classes/DiscoPoPResults'
import { CancelToken } from '../helpers/cancellation/CancelToken'
import { DefaultOptimizerOptions } from '../tools/DiscoPoPOptimizer'
import { ToolSuite } from '../tools/ToolSuite'

export class OptimizerWorkflow {
    public constructor(public readonly dotDiscoPoP: string) {}

    public async run(
        reportMessage: (message: string, nesting: number) => void,
        reportProgress: (progress: number) => void,
        cancelToken: CancelToken,
        overrideOptionsString?: string
    ): Promise<DiscoPoPResults> {
        const toolSuite = new ToolSuite(this.dotDiscoPoP)

        reportMessage('Running Optimizer...', 0)
        await toolSuite.discopopOptimizer.run(
            overrideOptionsString
                ? overrideOptionsString
                : DefaultOptimizerOptions,
            cancelToken
        )
        reportProgress(80)

        reportMessage('Creating Optimized Patches...', 0)
        await toolSuite.discopopPatchGenerator.createOptimizedPatches(
            cancelToken
        )
        reportProgress(10)

        reportMessage('Parsing Optimized Results...', 0)
        const results = await DiscoPoPParser.parse(this.dotDiscoPoP)
        reportProgress(10)

        return results
    }
}
