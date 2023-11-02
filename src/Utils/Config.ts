import * as vscode from 'vscode'

/**
 * Provides access to the extension settings and information derived from the settings.
 */
export abstract class Config {
    private constructor() {
        throw new Error('This class cannot be instantiated')
    }

    /**
     *
     * @returns the path to the discopop root directory as defined in the extension settings
     */
    public static discopopRoot(): string {
        return vscode.workspace
            .getConfiguration('discopop')
            ?.get('discopopRoot')
    }

    /**
     *
     * @returns the path to the discopop build directory (<discopopRoot>/build)
     */
    public static discopopBuild(): string {
        return this.discopopRoot() + '/build'
    }

    /**
     *
     * @returns the path to the hotspot detection root directory as defined in the extension settings
     */
    public static hotspotDetectionRoot(): string {
        return vscode.workspace
            .getConfiguration('discopop')
            ?.get('hotspotDetectionRoot')
    }

    /**
     *
     * @returns the path to the hotspot detection build directory (<hotspotDetectionRoot>/build)
     */
    public static hotspotDetectionBuild(): string {
        return this.hotspotDetectionRoot() + '/build'
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

    public static skipOverwriteConfirmation(): boolean {
        return vscode.workspace
            .getConfiguration('discopop')
            .get('skipOverwriteConfirmation', false)
    }

    /**
     * Throws an Error if a faulty discopop setup is detected
     */
    public static checkDiscoPoPSetup(): void {
        // check for discopop root
        if (!Config.discopopRoot()) {
            throw new Error(
                'The DiscoPoP root directory is not set. Please update the extension settings.'
            )
        }

        // check for discopop build directory
        if (!Config.discopopBuild()) {
            throw new Error(
                `${Config.discopopRoot()} does not contain a build directory. Make sure to build DiscoPoP!`
            )
        }

        // TODO more checks
        // e.g. correct version
        // e.g. run on a minimal project and see if results can be correctly parsed
    }

    /**
     * Throws an Error if a faulty hotspot detection setup is detected
     */
    public static checkHotspotDetectionSetup(): void {
        // check for hotspot detection root
        if (!Config.hotspotDetectionRoot()) {
            throw new Error(
                'The Hotspot Detection root directory is not set. Please update the extension settings.'
            )
        }

        // check for hotspot detection build directory
        if (!Config.hotspotDetectionBuild()) {
            throw new Error(
                `${Config.hotspotDetectionRoot()} does not contain a build directory. Make sure to build the hotspot detection!`
            )
        }

        // TODO more checks
        // e.g. correct version
        // e.g. run on a minimal project and see if results can be correctly parsed
    }
}
