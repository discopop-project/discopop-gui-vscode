import { Suggestion } from './classes/Suggestion/Suggestion'
import { JSONWebViewProvider } from '../Utils/JSONWebViewProvider'

export class DiscoPoPDetailViewProvider extends JSONWebViewProvider<any> {
    public constructor(
        suggestion: Suggestion | undefined,
        placeholder: string = `No suggestion selected. Select a suggestion to see the details here.`
    ) {
        super(suggestion?.pureJSONData, placeholder)
        const viewId = 'sidebar-suggestion-detail-view'
        this.register(viewId)
    }
}
