import * as fs from 'fs'
import { EventEmitter } from 'stream'

/**
 * This class is used to map the line numbers of suggestions to the actual line numbers in the source code.
 * This is necessary because the line numbers are not updated when the source code is changed. The line_mapping.json tells us how to map the line numbers and is updated by the patch_applicator.
 * The mapping provided by this class is automatically updated when the line_mapping.json file is changed.
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

    // Event that is fired when the line mapping file is changed
    private _eventEmitter = new EventEmitter()

    public onDidChange(
        callback: (discoPoPAppliedSuggestionsWatcher: this) => void
    ) {
        this._eventEmitter.on('change', () => callback(this))
    }

    private parseFile() {
        console.log('Parsing line mapping file')

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

    public getAppledSuggestions(): Set<number> {
        return this.appliedSuggestions
    }

    public isApplied(id: number): boolean {
        return this.appliedSuggestions.has(id)
    }

    public dispose() {
        fs.unwatchFile(this.appliedSuggestionsFile)
        this.appliedSuggestions.clear()
    }
}
