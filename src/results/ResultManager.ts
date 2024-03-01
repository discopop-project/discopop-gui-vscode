import { CombinedHotspot } from './resultStore/CombinedHotspot'
import { CombinedSuggestion } from './resultStore/CombinedSuggestion'
import { ResultStore } from './resultStore/ResultStore'

export interface ResultManagerCallbacks {
    onResultsLoaded(): void
}

export class ResultManager {
    private resultStore: ResultStore
    private fileWatchers: FileWatcher[] = []
    public constructor(
        private _dotDiscopop: string,
        private callbacks: ResultManagerCallbacks
    ) {
        this.resultStore = new ResultStore(_dotDiscopop)
        this._updateFileWatchers()
    }

    public update(dotDiscopop: string): void {
        // update the result store
        this._dotDiscopop = dotDiscopop
        this.resultStore.update(dotDiscopop)

        // update the file watchers
        this._updateFileWatchers()
    }

    private _updateFileWatchers(): void {
        // stop all running file watchers
        this.fileWatchers.forEach((watcher) => watcher.stop())
        this.fileWatchers = []

        // start new file watchers
        // TODO: individual resultStore.updateX() functions for each file type would be better, to avoid reparsing everything
        this.fileWatchers.push(
            new LineMappingWatcher(this._dotDiscopop, (_) => {
                this.resultStore.update()
                this.callbacks.onResultsLoaded()
            })
        )
        this.fileWatchers.push(
            new AppliedStatusWatcher(this._dotDiscopop, (_) => {
                this.resultStore.update()
                this.callbacks.onResultsLoaded()
            })
        )
        this.fileWatchers.push(
            new PatternsJSONWatcher(this._dotDiscopop, (_) => {
                this.resultStore.update()
                this.callbacks.onResultsLoaded()
            })
        )
    }

    /** returns true if the discoPoP results have all been parsed successfully. */
    public validSuggestions(): boolean {
        return this.resultStore.validSuggestions()
    }

    /**
     * returns true if the hotspot detection results have all been parsed successfully.
     * Note that the line_mapping is not required to be valid for this to return true.
     * */
    public validHotspots(): boolean {
        return this.resultStore.validHotspots()
    }

    public get suggestions(): Map<string, CombinedSuggestion[]> {
        return this.resultStore.suggestions
    }

    public get hotspots(): Map<string, CombinedHotspot[]> {
        return this.resultStore.hotspots
    }
}

class FileWatcher {
    public constructor(
        files: string[],
        onFileChanged: (filePath: string) => void
    ) {
        // TODO
    }

    public stop(): void {
        // TODO
    }
}

class LineMappingWatcher extends FileWatcher {
    public constructor(
        dotDiscopop: string,
        onFileChanged: (filePath: string) => void
    ) {
        const lineMappingPath = `${dotDiscopop}/line_mapping.json`
        super([lineMappingPath], onFileChanged)
    }
}

class AppliedStatusWatcher extends FileWatcher {
    public constructor(
        dotDiscopop: string,
        onFileChanged: (filePath: string) => void
    ) {
        const appliedStatusPath = `${dotDiscopop}/patch_applicator/applied_suggestions.json`
        super([appliedStatusPath], onFileChanged)
    }
}

class PatternsJSONWatcher extends FileWatcher {
    public constructor(
        dotDiscopop: string,
        onFileChanged: (filePath: string) => void
    ) {
        const patternsJSONPaths = [
            `${dotDiscopop}/patterns.json`,
            `${dotDiscopop}/optimizer/patterns.json`,
            `${dotDiscopop}/explorer/patterns.json`,
        ]
        super(patternsJSONPaths, onFileChanged)
    }
}
