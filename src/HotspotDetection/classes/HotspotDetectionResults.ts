import { FileMapping } from '../../FileMapping/FileMapping'
import { Hotspot } from './Hotspot'

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
}
