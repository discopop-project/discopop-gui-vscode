import * as vscode from 'vscode'
import { JSONWebViewProvider } from '../utils/JSONWebViewProvider'

export class HotspotDetailViewer extends JSONWebViewProvider<any> {
    public constructor(
        hotspotJSON: any | undefined,
        context: vscode.ExtensionContext
    ) {
        super(
            hotspotJSON,
            `No hotspot selected. Select a hotspot to see the details here.`,
            context,
            'sidebar-hotspot-detail-view'
        )
    }
}
