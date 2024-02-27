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
    public constructor(public readonly dotDiscoPoP: string) {}

    private _discopopConfigProvider: DiscoPoPConfigProvider = undefined
    public get discopopConfigProvider(): DiscoPoPConfigProvider {
        return (
            this._discopopConfigProvider ??
            (this._discopopConfigProvider = new DiscoPoPConfigProvider())
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
