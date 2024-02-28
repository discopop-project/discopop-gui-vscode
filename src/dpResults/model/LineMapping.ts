import * as fs from 'fs'

export class LineMapping {
    public constructor(private lineMapping: Map<number, Map<number, number>>) {}

    public static parse(dotDiscopop: string): LineMapping {
        const filePath = `${dotDiscopop}/line_mapping.json`
        if (!fs.existsSync(filePath)) {
            // TODO in this and other classes: move this check to _parseFile
            throw new Error(`File ${filePath} does not exist`)
        }
        return LineMapping._parseFile(filePath)
    }

    public getMappedLineNr(fileID: number, lineNr: number): number {
        const fileIDMapping = this.lineMapping.get(fileID)
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

    private static _parseFile(filePath: string): LineMapping {
        const resultMap = new Map()
        const lineMappingString = fs.readFileSync(filePath, 'utf-8')
        const lineMappingJSON = JSON.parse(lineMappingString)
        for (const [fileID, lineMapping] of Object.entries(lineMappingJSON)) {
            const fileIDNumber = Number(fileID)
            const lineMappingMap = new Map()
            for (const [lineNr, lineNrMapping] of Object.entries(lineMapping)) {
                const lineNrNumber = Number(lineNr)
                const lineNrMappingNumber = Number(lineNrMapping)
                lineMappingMap.set(lineNrNumber, lineNrMappingNumber)
            }
            resultMap.set(fileIDNumber, lineMappingMap)
        }
        return new LineMapping(resultMap)
    }
}
