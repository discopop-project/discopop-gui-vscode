import * as fs from 'fs'
import { ParsedResultSchema } from './ParsedResultSchema'

export class LineMapping implements ParsedResultSchema {
    private _lineMapping: Map<number, Map<number, number>> = new Map<
        number,
        Map<number, number>
    >()

    public constructor(private _dotDiscopop: string) {
        this.update(_dotDiscopop)
    }

    public getMappedLineNr(fileID: number, lineNr: number): number {
        const fileIDMapping = this._lineMapping.get(fileID)
        if (fileIDMapping) {
            const lineNrMapping = fileIDMapping.get(lineNr)
            if (lineNrMapping) {
                return lineNrMapping
            }
        }
        // fallback to original line number
        console.error(
            `no line mapping found for fileID ${fileID} and lineNr ${lineNr}`
        )
        return lineNr
    }

    public update(dotDiscopop: string = this._dotDiscopop): void {
        // reset internals
        this._dotDiscopop = dotDiscopop
        this._lineMapping.clear()

        const filePath = `${dotDiscopop}/line_mapping.json`
        if (!fs.existsSync(filePath)) {
            this._valid = false
            this._error = `line_mapping.json does not exist`
        } else {
            this._parseFile(filePath)
        }
    }

    private _valid = false
    /**
     * returns true if the lineMapping was parsed successfully.
     * Note: Using the lineMapping is still possible even if this returns false. Then the original line numbers are used.
     */
    public valid(): boolean {
        return this._valid
    }

    private _error: string | undefined = undefined
    public error(): string | undefined {
        return this._error
    }

    private _parseFile(filePath: string): void {
        try {
            // parse
            const lineMappingString = fs.readFileSync(filePath, 'utf-8')
            const lineMappingJSON = JSON.parse(lineMappingString)
            for (const [fileID, lineMapping] of Object.entries(
                lineMappingJSON
            )) {
                const fileIDNumber = Number(fileID)
                const lineMappingMap = new Map()
                for (const [lineNr, lineNrMapping] of Object.entries(
                    lineMapping
                )) {
                    const lineNrNumber = Number(lineNr)
                    const lineNrMappingNumber = Number(lineNrMapping)
                    lineMappingMap.set(lineNrNumber, lineNrMappingNumber)
                }
                this._lineMapping.set(fileIDNumber, lineMappingMap)
            }

            // mark as valid
            this._valid = true
            this._error = undefined
        } catch (error: any) {
            // oops
            this._valid = false
            console.log(error)
            this._error = 'Error while parsing line_mapping.json'
        }
    }
}
