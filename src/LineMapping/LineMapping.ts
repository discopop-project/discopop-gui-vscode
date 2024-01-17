import * as fs from 'fs'
import { EventEmitter } from 'stream'

/**
 * This class is used to map the line numbers of suggestions to the actual line numbers in the source code.
 * This is necessary because the line numbers are not updated when the source code is changed. The line_mapping.json tells us how to map the line numbers and is updated by the patch_applicator.
 * The mapping provided by this class is automatically updated when the line_mapping.json file is changed.
 */
export class LineMapping {
    private lineMapping: Map<number, Map<number, number>> = new Map()

    public constructor(public lineMappingFile: string) {
        this.parseLineMappingFile()
        // watch for changes of the file
        fs.watchFile(this.lineMappingFile, (curr, prev) => {
            this.parseLineMappingFile()
            this._eventEmitter.emit('change')
        })
    }

    // Event that is fired when the line mapping file is changed
    private _eventEmitter = new EventEmitter()

    public onDidChange(callback: () => void) {
        this._eventEmitter.on('change', callback)
    }

    private parseLineMappingFile() {
        // clear existing mapping
        this.lineMapping.clear()

        // read the file and populate the mapping again
        const lineMappingString = fs.readFileSync(this.lineMappingFile, 'utf-8')
        const lineMappingJSON = JSON.parse(lineMappingString)
        for (const [fileID, lineMapping] of Object.entries(lineMappingJSON)) {
            const fileIDNumber = Number(fileID)
            const lineMappingMap = new Map()
            for (const [lineNr, lineNrMapping] of Object.entries(lineMapping)) {
                const lineNrNumber = Number(lineNr)
                const lineNrMappingNumber = Number(lineNrMapping)
                lineMappingMap.set(lineNrNumber, lineNrMappingNumber)
            }
            this.lineMapping.set(fileIDNumber, lineMappingMap)
        }
    }

    public getMappedLineNr(fileID: number, lineNr: number): number {
        const fileIDMapping = this.lineMapping.get(fileID)
        if (fileIDMapping) {
            const lineNrMapping = fileIDMapping.get(lineNr)
            if (lineNrMapping) {
                return lineNrMapping
            }
        }
        return lineNr
    }

    public dispose() {
        fs.unwatchFile(this.lineMappingFile)
        this.lineMapping.clear()
    }
}
