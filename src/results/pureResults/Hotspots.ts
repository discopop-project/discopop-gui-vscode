import * as fs from 'fs'
import { ParsedResultSchema } from './ParsedResultSchema'

export interface Hotspot {
    fileId: number
    startLine: number
    hotness: 'YES' | 'NO' | 'MAYBE'
    avr: number
}

enum Hotness {
    YES = 'YES',
    NO = 'NO',
    MAYBE = 'MAYBE',
}

export class Hotspots implements ParsedResultSchema {
    public constructor(private _dotDiscopop: string) {
        this.hotspots.set(Hotness.YES, [])
        this.hotspots.set(Hotness.NO, [])
        this.hotspots.set(Hotness.MAYBE, [])
        this.update(_dotDiscopop)
    }

    /** provides mapping hotness --> hotspots */
    public readonly hotspots: Map<Hotness, Hotspot[]> = new Map<
        Hotness,
        Hotspot[]
    >()

    public update(dotDiscopop: string = this._dotDiscopop): void {
        this._dotDiscopop = dotDiscopop
        const filePath = `${dotDiscopop}/hotspot_detection/Hotspots.json`
        if (!fs.existsSync(filePath)) {
            this._valid = false
            this._error = `Hotspots.json does not exist`
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

    private _parseFile(filePath: string): void {
        try {
            // reset internals
            this.hotspots.get(Hotness.YES).length = 0
            this.hotspots.get(Hotness.NO).length = 0
            this.hotspots.get(Hotness.MAYBE).length = 0

            // parse
            const fileContents = fs.readFileSync(filePath, 'utf-8')
            const json = JSON.parse(fileContents)
            for (const hotspot of json.code_regions as any[]) {
                const fid: number = hotspot.fid
                const lineNum: number = hotspot.lineNum
                const hotness: Hotness = Hotness[hotspot.hotness as string]
                const avr: number = hotspot.avr
                this.hotspots.get(hotness).push({
                    fileId: fid,
                    startLine: lineNum,
                    hotness: hotness,
                    avr: avr,
                })
            }

            // mark as valid
            this._valid = true
            this._error = undefined
        } catch (error: any) {
            // oops
            this._valid = false
            console.log(error)
            this._error = 'Error parsing Hotspots.json'
        }
    }
}
