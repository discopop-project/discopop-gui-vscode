import { JSONWebViewProvider } from '../../utils/JSONWebViewProvider'
import { DiscoPoPSuggestion } from '../model/DiscoPoPSuggestion'

export class DiscoPoPDetailViewProvider extends JSONWebViewProvider<any> {
    public constructor(
        suggestion: DiscoPoPSuggestion | undefined,
        placeholder: string = `No suggestion selected. Select a suggestion to see the details here.`
    ) {
        super(suggestion?.pureJSONData, placeholder)
        const viewId = 'sidebar-suggestion-detail-view'
        this.register(viewId)
    }
}
