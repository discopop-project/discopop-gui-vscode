import * as fs from 'fs'

export class Hotspot {
    public constructor(
        public readonly fileId: number,
        public readonly startLine: number,
        public readonly hotness: 'YES' | 'NO' | 'MAYBE',
        public readonly avr: number,
        public readonly pureJSON: any
    ) {}

    public static parse(dotDiscopop: string): Hotspot[] {
        const filePath = `${dotDiscopop}/hotspot_detection/Hotspots.json`
        if (!fs.existsSync(filePath)) {
            throw new Error('Hotspots.json file not found.')
        }
        return Hotspot._parseHotspotsJsonFile(filePath)
    }

    private static _parseHotspotsJsonFile(path: string): Hotspot[] {
        const str = fs.readFileSync(path, 'utf-8')
        return Hotspot._parseHotspotsJsonString(str)
    }

    private static _parseHotspotsJsonString(text: string): Hotspot[] {
        const hotspots = JSON.parse(text)
        return Hotspot._parseHotspotsJsonJSON(hotspots)
    }

    private static _parseHotspotsJsonJSON(json: any): Hotspot[] {
        // TODO validate the json object
        const hotspotList: Hotspot[] = []
        for (const hotspot of json.code_regions as any[]) {
            const fid: number = hotspot.fid
            const lineNum: number = hotspot.lineNum
            const hotness: 'YES' | 'NO' | 'MAYBE' = hotspot.hotness
            const avr: number = hotspot.avr
            hotspotList.push(new Hotspot(fid, lineNum, hotness, avr, hotspot))
        }
        return hotspotList
    }
}
