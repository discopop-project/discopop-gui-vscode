import * as fs from 'fs'

export class FileMapping {
    private readonly inverseFileMapping: Map<string, number> = new Map() // filePath -> fileId

    public constructor(private readonly fileMapping: Map<number, string>) {
        this.inverseFileMapping = new Map(
            Array.from(fileMapping, (entry) => [entry[1], entry[0]])
        )
    }

    public getFilePath(fileId: number): string {
        return this.fileMapping.get(fileId)
    }

    public getFileId(filePath: string): number {
        return this.inverseFileMapping.get(filePath)
    }

    public static parse(dotDiscopop: string): FileMapping {
        const filePath = `${dotDiscopop}/FileMapping.txt`
        if (!fs.existsSync(filePath)) {
            throw new Error('FileMapping.txt file not found.')
        }
        return this._parseFile(filePath)
    }

    private static _parseFile(path: string): FileMapping {
        const fileMappingString = fs.readFileSync(path, 'utf-8')
        return FileMapping._parseString(fileMappingString)
    }

    private static _parseString(fileMappingStr: string): FileMapping {
        const map = fileMappingStr
            .split('\n') // split into lines
            .map((line) => line.trim()) // trim whitespace
            .filter((line) => line.length > 0) // remove empty lines
            .map((line) => line.split('\t')) // split into columns
            .map((line) => [parseInt(line[0]), line[1]] as [number, string]) // convert first column to int
            .reduce((map, entry) => {
                // convert to map
                map.set(entry[0], entry[1])
                return map
            }, new Map<number, string>())

        return new FileMapping(map)
    }
}
