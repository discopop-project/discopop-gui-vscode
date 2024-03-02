import * as fs from 'fs'
import { ParsedResultSchema } from './ParsedResultSchema'

export class FileMapping implements ParsedResultSchema {
    public constructor(private _dotDiscopop: string) {
        this.update(_dotDiscopop)
    }

    /** provides the mapping fileID -> filePath */
    private readonly fileMapping: Map<number, string> = new Map<
        number,
        string
    >()
    /** provides the mapping filePath -> fileID */
    private readonly inverseFileMapping: Map<string, number> = new Map<
        string,
        number
    >()

    public getFilePath(fileId: number): string {
        return this.fileMapping.get(fileId)
    }

    public getFileId(filePath: string): number {
        return this.inverseFileMapping.get(filePath)
    }

    public update(dotDiscopop: string = this._dotDiscopop): void {
        // reset internals
        this._dotDiscopop = dotDiscopop
        this.fileMapping.clear()
        this.inverseFileMapping.clear()

        const filePath = `${dotDiscopop}/FileMapping.txt`
        if (!fs.existsSync(filePath)) {
            this._valid = false
            this._error = `FileMapping.txt does not exist`
        } else {
            this._parseFile(filePath)
        }
    }

    private _valid = false
    public valid(): boolean {
        return this._valid
    }

    private _error: string | undefined = undefined
    public error(): string | undefined {
        return this._error
    }

    private _parseFile(path: string): void {
        try {
            // parse
            const fileContents = fs.readFileSync(path, 'utf-8')
            const lines = fileContents.split('\n')
            for (const line of lines) {
                const [idString, filePath] = line.split('\t')
                const id = Number(idString)
                this.fileMapping.set(id, filePath)
                this.inverseFileMapping.set(filePath, id)
            }

            // mark as valid
            this._valid = true
            this._error = undefined
        } catch (error: any) {
            // oops
            this._valid = false
            console.log(error)
            this._error = 'Error while parsing FileMapping.txt'
        }
    }
}
