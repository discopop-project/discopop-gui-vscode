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
    private constructor() {
        throw new Error('ToolSuite cannot be instantiated')
    }

    private static _discopopConfigProvider: DiscoPoPConfigProvider = undefined
    public static get discopopConfigProvider(): DiscoPoPConfigProvider {
        return (
            ToolSuite._discopopConfigProvider ??
            (ToolSuite._discopopConfigProvider = new DiscoPoPConfigProvider())
        )
    }

    private static _discopopCMakeInstrumentation: DiscoPoPCMakeBasedInstrumentation =
        undefined
    public static get discopopCMakeInstrumentation(): DiscoPoPCMakeBasedInstrumentation {
        return (
            this._discopopCMakeInstrumentation ??
            (this._discopopCMakeInstrumentation =
                new DiscoPoPCMakeBasedInstrumentation())
        )
    }

    private static _hotspotDetectionCMakeInstrumentation: HotspotDetectionCMakeBasedInstrumentation =
        undefined
    public static get hotspotDetectionCMakeInstrumentation(): HotspotDetectionCMakeBasedInstrumentation {
        return (
            this._hotspotDetectionCMakeInstrumentation ??
            (this._hotspotDetectionCMakeInstrumentation =
                new HotspotDetectionCMakeBasedInstrumentation())
        )
    }

    private static _discopopExplorer: DiscoPoPExplorer = undefined
    public static get discopopExplorer(): DiscoPoPExplorer {
        return (
            this._discopopExplorer ??
            (this._discopopExplorer = new DiscoPoPExplorer())
        )
    }

    private static _discopopPatchGenerator: DiscoPoPPatchGenerator = undefined
    public static get discopopPatchGenerator(): DiscoPoPPatchGenerator {
        return (
            this._discopopPatchGenerator ??
            (this._discopopPatchGenerator = new DiscoPoPPatchGenerator())
        )
    }

    private static _discopopPatchApplicator: DiscoPoPPatchApplicator = undefined
    public static get discopopPatchApplicator(): DiscoPoPPatchApplicator {
        return (
            this._discopopPatchApplicator ??
            (this._discopopPatchApplicator = new DiscoPoPPatchApplicator())
        )
    }

    private static _discopopOptimizer: DiscoPoPOptimizer = undefined
    public static get discopopOptimizer(): DiscoPoPOptimizer {
        return (
            this._discopopOptimizer ??
            (this._discopopOptimizer = new DiscoPoPOptimizer())
        )
    }

    private static _hotspotDetection: HotspotDetection = undefined
    public static get hotspotDetection(): HotspotDetection {
        return (
            this._hotspotDetection ??
            (this._hotspotDetection = new HotspotDetection())
        )
    }
}
