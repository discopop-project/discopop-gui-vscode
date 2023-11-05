import { FileMapping } from '../FileMapping/FileMapping'
import { Hotspot } from './classes/Hotspot'

export class HotspotDetectionResults {
    public constructor(public readonly hotspots: Hotspot[]) {}

    // convenience methods to sort and filter results:

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
        fileMapping: FileMapping,
        // TODO lineMapping: LineMapping,
        filterByHotness?: 'YES' | 'NO' | 'MAYBE',
        sortByKey?: keyof Hotspot
    ): Hotspot[] {
        const fid = fileMapping.getFileId(fileName)
        return this.getHotspotsByFileID(fid, filterByHotness, sortByKey)
    }
}
