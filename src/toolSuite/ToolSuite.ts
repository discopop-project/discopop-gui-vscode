import { DiscoPoPCMakeBasedInstrumentation } from './instrumentation/DiscoPoPCMakeBasedInstrumentation'
import { HotspotDetectionCMakeBasedInstrumentation } from './instrumentation/HotspotDetectionCMakeBasedInstrumentation'
import { DiscoPoPConfigProvider } from './tools/DiscoPoPConfigProvider'
import { DiscoPoPExplorer } from './tools/DiscoPoPExplorer'
import { DiscoPoPOptimizer } from './tools/DiscoPoPOptimizer'
import { DiscoPoPPatchApplicator } from './tools/DiscoPoPPatchApplicator'
import { DiscoPoPPatchGenerator } from './tools/DiscoPoPPatchGenerator'
import { HotspotDetection } from './tools/HotspotDetection'

/**
 * provides access to the DiscoPoP tools
 */
export class ToolSuite {
    public constructor() {}

    private static _discopopConfigProvider: DiscoPoPConfigProvider = undefined
    public static get discopopConfigProvider(): DiscoPoPConfigProvider {
        return (
            ToolSuite._discopopConfigProvider ??
            (ToolSuite._discopopConfigProvider = new DiscoPoPConfigProvider())
        )
    }

    private _discopopCMakeInstrumentation: DiscoPoPCMakeBasedInstrumentation =
        undefined
    public get discopopCMakeInstrumentation(): DiscoPoPCMakeBasedInstrumentation {
        return (
            this._discopopCMakeInstrumentation ??
            (this._discopopCMakeInstrumentation =
                new DiscoPoPCMakeBasedInstrumentation())
        )
    }

    private _hotspotDetectionCMakeInstrumentation: HotspotDetectionCMakeBasedInstrumentation =
        undefined
    public get hotspotDetectionCMakeInstrumentation(): HotspotDetectionCMakeBasedInstrumentation {
        return (
            this._hotspotDetectionCMakeInstrumentation ??
            (this._hotspotDetectionCMakeInstrumentation =
                new HotspotDetectionCMakeBasedInstrumentation())
        )
    }

    private _discopopExplorer: DiscoPoPExplorer = undefined
    public get discopopExplorer(): DiscoPoPExplorer {
        return (
            this._discopopExplorer ??
            (this._discopopExplorer = new DiscoPoPExplorer())
        )
    }

    private _discopopPatchGenerator: DiscoPoPPatchGenerator = undefined
    public get discopopPatchGenerator(): DiscoPoPPatchGenerator {
        return (
            this._discopopPatchGenerator ??
            (this._discopopPatchGenerator = new DiscoPoPPatchGenerator())
        )
    }

    private _discopopPatchApplicator: DiscoPoPPatchApplicator = undefined
    public get discopopPatchApplicator(): DiscoPoPPatchApplicator {
        return (
            this._discopopPatchApplicator ??
            (this._discopopPatchApplicator = new DiscoPoPPatchApplicator())
        )
    }

    private _discopopOptimizer: DiscoPoPOptimizer = undefined
    public get discopopOptimizer(): DiscoPoPOptimizer {
        return (
            this._discopopOptimizer ??
            (this._discopopOptimizer = new DiscoPoPOptimizer())
        )
    }

    private _hotspotDetection: HotspotDetection = undefined
    public get hotspotDetection(): HotspotDetection {
        return (
            this._hotspotDetection ??
            (this._hotspotDetection = new HotspotDetection())
        )
    }
}
