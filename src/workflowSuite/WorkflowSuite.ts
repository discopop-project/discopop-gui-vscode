import { DiscoPoPCMakeWorkflow } from './workflows/DiscoPoPCMakeWorkflow'
import { HotspotDetectionCMakeWorkflow } from './workflows/HotspotDetectionCMakeWorkflow'
import { OptimizerWorkflow } from './workflows/OptimizerWorkflow'

export class WorkflowSuite {
    public constructor() {}

    private _optimizerWorkflow: OptimizerWorkflow = undefined
    public get optimizerWorkflow(): OptimizerWorkflow {
        return (
            this._optimizerWorkflow ??
            (this._optimizerWorkflow = new OptimizerWorkflow())
        )
    }

    private _hotspotDetectionWorkflow: HotspotDetectionCMakeWorkflow = undefined
    public get hotspotDetectionWorkflow(): HotspotDetectionCMakeWorkflow {
        return (
            this._hotspotDetectionWorkflow ??
            (this._hotspotDetectionWorkflow =
                new HotspotDetectionCMakeWorkflow())
        )
    }

    private _discopopWorkflow: DiscoPoPCMakeWorkflow = undefined
    public get discopopWorkflow(): DiscoPoPCMakeWorkflow {
        return (
            this._discopopWorkflow ??
            (this._discopopWorkflow = new DiscoPoPCMakeWorkflow())
        )
    }
}
