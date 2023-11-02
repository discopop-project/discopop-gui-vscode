import { JSONWebViewProvider } from '../Utils/JSONWebViewProvider'
import { Hotspot } from './classes/Hotspot'

export class HotspotDetailViewProvider extends JSONWebViewProvider<any> {
    private static instance: HotspotDetailViewProvider | undefined

    private constructor(hotspot: Hotspot | undefined, placeholder: string) {
        super(hotspot?.pureJSONData, placeholder)
    }

    public static load(suggestion: Hotspot | undefined) {
        if (!HotspotDetailViewProvider.instance) {
            const viewId = 'sidebar-hotspot-detail-view'
            const placeholder = `No hotspot selected. Select a hotspot to see the details here.`
            HotspotDetailViewProvider.instance = new HotspotDetailViewProvider(
                undefined,
                placeholder
            )
            HotspotDetailViewProvider.instance.register(viewId)
        }

        HotspotDetailViewProvider.instance.replaceContents(
            suggestion?.pureJSONData
        )
    }

    public static dispose() {
        HotspotDetailViewProvider.instance?.unregister()
        HotspotDetailViewProvider.instance = undefined
    }
}
