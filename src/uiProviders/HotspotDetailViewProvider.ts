import { Hotspot } from '../discopop/model/Hotspot'
import { JSONWebViewProvider } from '../utils/JSONWebViewProvider'

export class HotspotDetailViewProvider extends JSONWebViewProvider<any> {
    public constructor(
        hotspot: Hotspot | undefined,
        placeholder: string = `No hotspot selected. Select a hotspot to see the details here.`
    ) {
        super(hotspot?.pureJSONData, placeholder)
        const viewId = 'sidebar-hotspot-detail-view'
        this.register(viewId)
    }
}
