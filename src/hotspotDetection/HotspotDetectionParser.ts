import * as fs from 'fs'
import { FileMappingParser } from '../fileMapping/FileMappingParser'
import { Hotspot } from './classes/Hotspot'
import { HotspotDetectionResults } from './classes/HotspotDetectionResults'

export abstract class HotspotDetectionParser {
    private constructor() {
        throw new Error('This class should not be instantiated')
    }

    private static _parseHotspotsJsonFile(path: string): Hotspot[] {
        if (!fs.existsSync(path)) {
            throw new Error('Hotspots.json file not found.')
        }

        const str = fs.readFileSync(path, 'utf-8')
        return HotspotDetectionParser._parseHotspotsJsonString(str)
    }

    private static _parseHotspotsJsonString(text: string): Hotspot[] {
        const hotspots = JSON.parse(text)
        return HotspotDetectionParser._parseHotspotsJsonJSON(hotspots)
    }

    private static _parseHotspotsJsonJSON(json: any): Hotspot[] {
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
        return hotspotList
    }

    public static async parse(
        dotDiscoPoP: string
    ): Promise<HotspotDetectionResults> {
        const fileMapping = FileMappingParser.parseFile(
            dotDiscoPoP + '/FileMapping.txt'
        )

        const hotspots = HotspotDetectionParser._parseHotspotsJsonFile(
            dotDiscoPoP + '/hotspot_detection/Hotspots.json'
        )

        return new HotspotDetectionResults(fileMapping, hotspots)
    }
}
