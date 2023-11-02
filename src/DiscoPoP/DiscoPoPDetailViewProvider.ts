import { Suggestion } from './classes/Suggestion/Suggestion'
import { JSONWebViewProvider } from '../Utils/JSONWebViewProvider'

export class DiscoPoPDetailViewProvider extends JSONWebViewProvider<any> {
    private static instance: DiscoPoPDetailViewProvider | undefined

    private constructor(
        suggestion: Suggestion | undefined,
        placeholder: string
    ) {
        super(suggestion?.pureJSONData, placeholder)
    }

    public static load(suggestion: Suggestion | undefined) {
        if (!DiscoPoPDetailViewProvider.instance) {
            const viewId = 'sidebar-suggestion-detail-view'
            const placeholder = `No suggestion selected. Select a suggestion to see the details here.`
            DiscoPoPDetailViewProvider.instance =
                new DiscoPoPDetailViewProvider(undefined, placeholder)
            DiscoPoPDetailViewProvider.instance.register(viewId)
        }

        DiscoPoPDetailViewProvider.instance.replaceContents(
            suggestion?.pureJSONData
        )
    }

    public static dispose() {
        DiscoPoPDetailViewProvider.instance?.unregister()
        DiscoPoPDetailViewProvider.instance = undefined
    }
}
