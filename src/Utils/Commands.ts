export class Commands {
    // project
    public static addProject: string = 'discopop.addProject'
    public static removeProject: string = 'discopop.removeProject'
    public static renameProject: string = 'discopop.renameProject'

    // configuration
    public static addConfiguration: string = 'discopop.addConfiguration'
    public static removeConfiguration: string = 'discopop.removeConfiguration'
    public static renameConfiguration: string = 'discopop.renameConfiguration'
    public static copyConfiguration: string = 'discopop.copyConfiguration'

    // runners
    public static runDiscoPoPAndHotspotDetection: string =
        'discopop.runDiscoPoPAndHotspotDetection'
    public static runDiscoPoP: string = 'discopop.runDiscoPoP'
    public static runHotspotDetection: string = 'discopop.runHotspotDetection'
    public static loadDiscoPoPResults = 'discopop.loadDiscoPoPResults'
    public static loadHotspotResults = 'discopop.loadHotspotResults'

    // configurationItem
    public static editConfigurationItem: string =
        'discopop.editConfigurationItem'
    public static showSuggestionDetails: string =
        'discopop.showSuggestionDetails'
    public static showHotspotDetails: string = 'discopop.showHotspotDetails'

    // suggestions
    public static applySuggestions: string = 'discopop.applySuggestions'
    public static rollbackSuggestions: string = 'discopop.rollbackSuggestions'
    public static applySingleSuggestion: string =
        'discopop.applySingleSuggestion'
    public static rollbackSingleSuggestion: string =
        'discopop.rollbackSingleSuggestion'
    public static rollbackAllSuggestions: string =
        'discopop.rollbackAllSuggestions'

    // enable/disable/change settings
    // TODO
    // public static enableCodeLens: string = 'discopop.enableCodeLens'
    //public static disableCodeLens: string = 'discopop.disableCodeLens'
}
