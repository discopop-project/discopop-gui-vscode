import * as fs from 'fs'

export class FileMapping {
    private fileMapping: Map<number, string> = new Map() // fileId -> filePath
    private inverseFileMapping: Map<string, number> = new Map() // filePath -> fileId

    public constructor(mapping: Map<number, string>) {
        this.fileMapping = mapping
        this.inverseFileMapping = new Map(
            Array.from(mapping, (entry) => [entry[1], entry[0]])
        )
    }

    public getFilePath(fileId: number): string {
        return this.fileMapping.get(fileId)
    }

    public getFileId(filePath: string): number {
        return this.inverseFileMapping.get(filePath)
    }

    public getAllFilePaths(): string[] {
        return Array.from(this.fileMapping.values())
    }

    public getAllFileIds(): number[] {
        return Array.from(this.inverseFileMapping.values())
    }

    public toString(): string {
        return Array.from(this.fileMapping.entries())
            .map((entry) => `${entry[0]}\t${entry[1]}`)
            .join('\n')
    }

    /**
     * parses a FileMapping.txt file and returns a FileMapping object
     * @param filePath path to the FileMapping.txt file
     * @returns the FileMapping object
     */
    public static parseFile(path: string): FileMapping {
        if (!fs.existsSync(path)) {
            throw new Error('FileMapping.txt file not found.')
        }
        const fileMappingString = fs.readFileSync(path, 'utf-8')
        return FileMapping.parseString(fileMappingString)
    }

    /**
     * given the contents of a FileMapping.txt file, returns a FileMapping object
     * @param fileMappingStr contents of a FileMapping.txt file
     * @returns the FileMapping object
     */
    public static parseString(fileMappingStr) {
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
