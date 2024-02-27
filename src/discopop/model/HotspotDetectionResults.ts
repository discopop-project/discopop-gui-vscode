import { FileMapping } from './FileMapping'
import { Hotspot } from './Hotspot'

import * as fs from 'fs'

export class HotspotDetectionResults {
    public constructor(
        public fileMapping: FileMapping,
        public hotspots: Hotspot[]
    ) {}

    private static _sortByKey = (
        hotspots: Hotspot[],
        key?: keyof Hotspot
    ): Hotspot[] => {
        if (!key) {
            return hotspots
        }
        return hotspots.sort((a, b) => {
            if (a[key] < b[key]) {
                return -1
            } else if (a[key] > b[key]) {
                return 1
            } else {
                return 0
            }
        })
    }

    public getHotspotsByFileID(
        fid: number,
        filterByHotness?: 'YES' | 'NO' | 'MAYBE',
        sortByKey?: keyof Hotspot
    ): Hotspot[] {
        const hotspots = this.hotspots.filter((h) => h.fid === fid)
        if (filterByHotness) {
            return HotspotDetectionResults._sortByKey(
                hotspots.filter((h) => h.hotness === filterByHotness),
                sortByKey
            )
        } else {
            return HotspotDetectionResults._sortByKey(hotspots, sortByKey)
        }
    }

    public getHotspotsByFilePath(
        fileName: string,
        filterByHotness?: 'YES' | 'NO' | 'MAYBE',
        sortByKey?: keyof Hotspot
    ): Hotspot[] {
        const fid = this.fileMapping.getFileId(fileName)
        return this.getHotspotsByFileID(fid, filterByHotness, sortByKey)
    }

    private static _parseHotspotsJsonFile(path: string): Hotspot[] {
        if (!fs.existsSync(path)) {
            throw new Error('Hotspots.json file not found.')
        }

        const str = fs.readFileSync(path, 'utf-8')
        return HotspotDetectionResults._parseHotspotsJsonString(str)
    }

    private static _parseHotspotsJsonString(text: string): Hotspot[] {
        const hotspots = JSON.parse(text)
        return HotspotDetectionResults._parseHotspotsJsonJSON(hotspots)
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
        const fileMapping = FileMapping.parseFile(
            dotDiscoPoP + '/FileMapping.txt'
        )

        const hotspots = HotspotDetectionResults._parseHotspotsJsonFile(
            dotDiscoPoP + '/hotspot_detection/Hotspots.json'
        )

        return new HotspotDetectionResults(fileMapping, hotspots)
    }
}
