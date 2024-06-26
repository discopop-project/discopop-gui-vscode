import * as fs from 'fs'

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

export class Hotspots {
    public constructor(private _dotDiscopop?: string) {
        if (_dotDiscopop) {
            this.update(_dotDiscopop)
        } else {
            this._valid = false
            this._error = `no .discopop directory provided`
        }
    }

    /** provides mapping hotness --> hotspots */
    public readonly hotspots: Map<Hotness, Hotspot[]> = new Map<
        Hotness,
        Hotspot[]
    >()

    public update(dotDiscopop: string = this._dotDiscopop): void {
        // reset internals
        this._dotDiscopop = dotDiscopop
        this.hotspots.clear()

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
    public get error(): string | undefined {
        return this._error
    }

    private _parseFile(filePath: string): void {
        try {
            // parse
            this.hotspots.set(Hotness.YES, [])
            this.hotspots.set(Hotness.NO, [])
            this.hotspots.set(Hotness.MAYBE, [])
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
