export class Commands {
    // configuration
    public static readonly addConfiguration: string =
        'discopop.addConfiguration'
    public static readonly removeConfiguration: string =
        'discopop.removeConfiguration'
    public static readonly copyConfiguration: string =
        'discopop.copyConfiguration'
    public static readonly editConfigurationOrProperty: string =
        'discopop.editConfigurationOrProperty'
    public static readonly deleteSelectedConfigurations: string =
        'discopop.deleteSelectedConfigurations'

    public static readonly addScript: string = 'discopop.addScript'
    public static readonly removeScript: string = 'discopop.removeScript'
    public static readonly runScript: string = 'discopop.runScript'

    // runners
    public static readonly runDiscoPoP: string = 'discopop.runDiscoPoP'
    public static readonly runHotspotDetection: string =
        'discopop.runHotspotDetection'
    public static readonly runDiscoPoPAndHotspotDetection: string =
        'discopop.runDiscoPoPAndHotspotDetection'
    public static readonly runOptimizer: string = 'discopop.runOptimizer'
    public static readonly loadResults = 'discopop.loadResults'

    // suggestions
    public static readonly showSuggestionDetails: string =
        'discopop.showSuggestionDetails'
    public static readonly previewSuggestion: string =
        'discopop.previewSuggestion'
    public static readonly applySingleSuggestion: string =
        'discopop.applySingleSuggestion'
    public static readonly rollbackSingleSuggestion: string =
        'discopop.rollbackSingleSuggestion'
    public static readonly rollbackAllSuggestions: string =
        'discopop.clearSuggestions'
    // TODO
    public static readonly filterSuggestions: string =
        'discopop.filterSuggestions'

    // interactive export
    public static readonly markSuggestionForInteractiveExport: string =
        'discopop.markSuggestionForInteractiveExport'
    public static readonly createInteractiveExport: string =
        'discopop.createInteractiveExport'

    // hotspots
    public static readonly showHotspotDetails: string =
        'discopop.showHotspotDetails'

    // data dependencies
    public static readonly showDataDependentDetails: string =
        'discopop.showDataDependentDetails'
    public static readonly showDataDependency: string =
        'discopop.showDataDependency'

    // codeLens
    public static readonly toggleCodeLens: string = 'discopop.toggleCodeLens' // global setting
    public static readonly enableCodeLens: string = 'discopop.enableCodeLens' // temporarily enable codeLens
    public static readonly disableCodeLens: string = 'discopop.disableCodeLens' // temporarily disable codeLens
    public static readonly codeLensApply: string = 'discopop.codeLensClicked' // apply suggestions from the codeLens
}
