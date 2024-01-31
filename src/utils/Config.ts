import * as vscode from 'vscode'

/**
 * Provides access to the extension settings and information derived from the settings.
 */
export abstract class Config {
    private constructor() {
        throw new Error('This class cannot be instantiated')
    }

    /**
     * wether or not the extension should show codeLenses for DiscoPoP recommendations.
     * Can be defined in the extension settings.
     */
    public static codeLensEnabled(): boolean {
        return vscode.workspace
            .getConfiguration('discopop')
            .get('recommendationsCodeLens', true)
    }

    /**
     * wether or not the user should be asked for confirmation before overwriting existing files.
     */
    public static skipOverwriteConfirmation(): boolean {
        return vscode.workspace
            .getConfiguration('discopop')
            .get('skipOverwriteConfirmation', false)
    }

    public static suggestionApplySkipConfirmation(): boolean {
        return vscode.workspace
            .getConfiguration('discopop')
            .get('suggestionApplySkipConfirmation', false)
    }

    public static suggestionPreviewMode(): SuggestionPreviewMode {
        return vscode.workspace
            .getConfiguration('discopop')
            .get('suggestionPreviewMode', SuggestionPreviewMode.PEEK)
    }
}

export enum SuggestionPreviewMode {
    EDITOR = 'Editor',
    PEEK = 'Peek',
    // TODO DIFF
}
