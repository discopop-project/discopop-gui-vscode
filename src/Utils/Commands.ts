export class Commands {
    // configuration
    public static addConfiguration: string = 'discopop.addConfiguration'
    public static removeConfiguration: string = 'discopop.removeConfiguration'
    public static copyConfiguration: string = 'discopop.copyConfiguration'
    public static editConfigurationOrProperty: string =
        'discopop.editConfigurationOrProperty'

    // runners
    public static runDiscoPoPAndHotspotDetection: string =
        'discopop.runDiscoPoPAndHotspotDetection'
    public static runDiscoPoP: string = 'discopop.runDiscoPoP'
    public static runHotspotDetection: string = 'discopop.runHotspotDetection'
    public static loadResults = 'discopop.loadResults'

    // suggestions
    public static showSuggestionDetails: string =
        'discopop.showSuggestionDetails'
    public static applySuggestions: string = 'discopop.applySuggestions' // used from the codelenses
    public static rollbackSuggestions: string = 'discopop.rollbackSuggestions' // used from the codelenses
    public static applySingleSuggestion: string =
        'discopop.applySingleSuggestion' // used from the tree view
    public static rollbackSingleSuggestion: string =
        'discopop.rollbackSingleSuggestion' // used from the tree view
    public static rollbackAllSuggestions: string =
        'discopop.rollbackAllSuggestions' // used from the tree view

    // hotspots
    public static showHotspotDetails: string = 'discopop.showHotspotDetails'

    // codeLens
    public static toggleCodeLens: string = 'discopop.toggleCodeLens' // global setting
    public static enableCodeLens: string = 'discopop.enableCodeLens' // temporarily enable codeLens
    public static disableCodeLens: string = 'discopop.disableCodeLens' // temporarily disable codeLens
}
