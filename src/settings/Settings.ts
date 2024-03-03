export interface Settings {
    skipConfirmation: {
        applyRollbackSuggestion: boolean
        overwriteBuild: boolean
    }
    codeLens: {
        enabled: boolean
    }
    previewMode: 'Peek' | 'Editor'
}
