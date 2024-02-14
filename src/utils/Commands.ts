export class Commands {
    // configuration
    public static addConfiguration: string = 'discopop.addConfiguration'
    public static removeConfiguration: string = 'discopop.removeConfiguration'
    public static copyConfiguration: string = 'discopop.copyConfiguration'
    public static editConfigurationOrProperty: string =
        'discopop.editConfigurationOrProperty'

    public static addScript: string = 'discopop.addScript'
    public static removeScript: string = 'discopop.removeScript'
    public static runScript: string = 'discopop.runScript'

    // runners
    public static runDiscoPoP: string = 'discopop.runDiscoPoP'
    public static runHotspotDetection: string = 'discopop.runHotspotDetection'
    public static runDiscoPoPAndHotspotDetection: string =
        'discopop.runDiscoPoPAndHotspotDetection'
    public static runOptimizer: string = 'discopop.runOptimizer'
    public static loadResults = 'discopop.loadResults'

    // suggestions
    public static showSuggestionDetails: string =
        'discopop.showSuggestionDetails'
    public static applySuggestions: string = 'discopop.applySuggestions'
    public static previewSuggestion: string = 'discopop.previewSuggestion'
    public static applySingleSuggestion: string =
        'discopop.applySingleSuggestion'
    public static rollbackSingleSuggestion: string =
        'discopop.rollbackSingleSuggestion'
    public static rollbackAllSuggestions: string = 'discopop.clearSuggestions'
    public static filterSuggestions: string = 'discopop.filterSuggestions'

    // hotspots
    public static showHotspotDetails: string = 'discopop.showHotspotDetails'

    // codeLens
    public static toggleCodeLens: string = 'discopop.toggleCodeLens' // global setting
    public static enableCodeLens: string = 'discopop.enableCodeLens' // temporarily enable codeLens
    public static disableCodeLens: string = 'discopop.disableCodeLens' // temporarily disable codeLens
}
