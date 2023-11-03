import * as fs from 'fs'
import { HotspotDetectionResults } from './HotspotDetectionResults'
import { Hotspot } from './classes/Hotspot'

export abstract class HotspotDetectionParser {
    private constructor() {
        throw new Error('This class should not be instantiated')
    }

    public static parseFile(path: string): HotspotDetectionResults {
        const str = fs.readFileSync(path, 'utf-8')
        return HotspotDetectionParser.parseString(str)
    }

    public static parseString(text: string): HotspotDetectionResults {
        const hotspots = JSON.parse(text)
        return HotspotDetectionParser.parseJSON(hotspots)
    }

    public static parseJSON(json: any): HotspotDetectionResults {
        // TODO validate the json object
        const hotspotList: Hotspot[] = []
        for (const hotspot of json.code_regions as any[]) {
            // read general fields
            const fid: number = hotspot.fid
            const lineNum: number = hotspot.lineNum
            const hotness: 'YES' | 'NO' | 'MAYBE' = hotspot.hotness
            const avr: number = hotspot.avr

            hotspotList.push(new Hotspot(fid, lineNum, hotness, avr, hotspot))
        }
        return new HotspotDetectionResults(hotspotList)
    }
}
