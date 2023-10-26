import * as vscode from 'vscode'

export class Config {
    // // TODO should we add and call this method to ensure that these config values are always up to date?
    // // or should we just turn the strings into functions?
    // // or is it fine as it is?
    // public static registerConfigChangeListener() {
    //     vscode.workspace.onDidChangeConfiguration((event) => {
    //         if (event.affectsConfiguration('discopop')) {
    //             Config.discopopRoot = vscode.workspace
    //                 .getConfiguration('discopop')
    //                 ?.get('discopopRoot')
    //             Config.discopopBuild =
    //                 vscode.workspace.getConfiguration('discopop').get('discopopRoot') +
    //                 '/build'
    //             Config.codeLensEnabled = vscode.workspace
    //                 .getConfiguration('discopop')
    //                 .get('recommendationsCodeLens', true)
    //         }
    //     })
    // }

    public static discopopRoot: string = vscode.workspace
        .getConfiguration('discopop')
        ?.get('discopopRoot')

    public static discopopBuild: string =
        vscode.workspace.getConfiguration('discopop').get('discopopRoot') +
        '/build'

    public static codeLensEnabled: boolean = vscode.workspace
        .getConfiguration('discopop')
        .get('recommendationsCodeLens', true)
}
