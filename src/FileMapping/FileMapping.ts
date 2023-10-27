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
}
