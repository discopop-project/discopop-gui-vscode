import * as fs from 'fs'
import { EventEmitter } from 'stream'

/**
 * This class is similar to the LineMapping class, but it is used to keep track of the applied suggestions.
 * The mapping provided by this class is automatically updated when the underlying data is updated.
 */
export class DiscoPoPAppliedSuggestionsWatcher {
    private appliedSuggestions: Set<number> = new Set()

    public constructor(public appliedSuggestionsFile: string) {
        this.parseFile()
        // watch for changes of the file
        fs.watchFile(this.appliedSuggestionsFile, (curr, prev) => {
            this.parseFile()
            this._eventEmitter.emit('change')
        })
    }

    // Event that is fired when the applied_suggestions file is changed
    private _eventEmitter = new EventEmitter()

    public onDidChange(
        callback: (discoPoPAppliedSuggestionsWatcher: this) => void
    ) {
        this._eventEmitter.on('change', () => callback(this))
    }
    public offDidChange(
        callback: (discoPoPAppliedSuggestionsWatcher: this) => void
    ) {
        this._eventEmitter.off('change', () => callback(this))
    }

    private parseFile() {
        console.log('Parsing applied_suggestions.json file')

        // clear the set
        this.appliedSuggestions.clear()

        // read the file and populate the set again
        const fileContents = fs.readFileSync(
            this.appliedSuggestionsFile,
            'utf-8'
        )
        const json = JSON.parse(fileContents)
        for (const idString of json.applied) {
            const id = Number(idString)
            this.appliedSuggestions.add(id)
        }
    }

    public getAppliedSuggestions(): Set<number> {
        return this.appliedSuggestions
    }

    public isApplied(id: number): boolean {
        return this.appliedSuggestions.has(id)
    }

    public dispose() {
        fs.unwatchFile(this.appliedSuggestionsFile)
        this._eventEmitter.removeAllListeners()
        this.appliedSuggestions.clear()
    }
}
