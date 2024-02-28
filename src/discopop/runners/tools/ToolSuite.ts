import { DiscoPoPConfigProvider } from './DiscoPoPConfigProvider'
import { DiscoPoPExplorer } from './DiscoPoPExplorer'
import { DiscoPoPOptimizer } from './DiscoPoPOptimizer'
import { DiscoPoPPatchApplicator } from './DiscoPoPPatchApplicator'
import { DiscoPoPPatchGenerator } from './DiscoPoPPatchGenerator'
import { HotspotDetection } from './HotspotDetection'
import { DiscoPoPCMakeBasedInstrumentation } from './instrumentation/DiscoPoPCMakeBasedInstrumentation'
import { HotspotDetectionCMakeBasedInstrumentation } from './instrumentation/HotspotDetectionCMakeBasedInstrumentation'

/**
 * provides access to the DiscoPoP tools
 */
export class ToolSuite {
    public constructor(public readonly dotDiscoPoP: string) {}

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
                new DiscoPoPCMakeBasedInstrumentation(this.dotDiscoPoP))
        )
    }

    private _hotspotDetectionCMakeInstrumentation: HotspotDetectionCMakeBasedInstrumentation =
        undefined
    public get hotspotDetectionCMakeInstrumentation(): HotspotDetectionCMakeBasedInstrumentation {
        return (
            this._hotspotDetectionCMakeInstrumentation ??
            (this._hotspotDetectionCMakeInstrumentation =
                new HotspotDetectionCMakeBasedInstrumentation(this.dotDiscoPoP))
        )
    }

    private _discopopExplorer: DiscoPoPExplorer = undefined
    public get discopopExplorer(): DiscoPoPExplorer {
        return (
            this._discopopExplorer ??
            (this._discopopExplorer = new DiscoPoPExplorer(this.dotDiscoPoP))
        )
    }

    private _discopopPatchGenerator: DiscoPoPPatchGenerator = undefined
    public get discopopPatchGenerator(): DiscoPoPPatchGenerator {
        return (
            this._discopopPatchGenerator ??
            (this._discopopPatchGenerator = new DiscoPoPPatchGenerator(
                this.dotDiscoPoP
            ))
        )
    }

    private _discopopPatchApplicator: DiscoPoPPatchApplicator = undefined
    public get discopopPatchApplicator(): DiscoPoPPatchApplicator {
        return (
            this._discopopPatchApplicator ??
            (this._discopopPatchApplicator = new DiscoPoPPatchApplicator(
                this.dotDiscoPoP
            ))
        )
    }

    private _discopopOptimizer: DiscoPoPOptimizer = undefined
    public get discopopOptimizer(): DiscoPoPOptimizer {
        return (
            this._discopopOptimizer ??
            (this._discopopOptimizer = new DiscoPoPOptimizer(this.dotDiscoPoP))
        )
    }

    private _hotspotDetection: HotspotDetection = undefined
    public get hotspotDetection(): HotspotDetection {
        return (
            this._hotspotDetection ??
            (this._hotspotDetection = new HotspotDetection(this.dotDiscoPoP))
        )
    }

    // // the code_generator tool is currently not needed directly, it is only implicitly used by the patch_generator
    // private _codeGenerator: CodeGenerator = undefined
    // public get codeGenerator(): CodeGenerator {
    //     return this._codeGenerator ?? (this._codeGenerator = new CodeGenerator(this.dotDiscoPoP))
    // }
}
