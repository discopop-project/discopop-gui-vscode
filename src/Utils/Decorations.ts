import * as vscode from 'vscode'

/** Decorations to highlight code in the editor */
export namespace Decoration {
    /** To indicate a hotspot with hotness YES */
    export const YES = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255,0,0,0.5)', // strong red
        isWholeLine: true,
    })

    /** To indicate a hotspot with hotness MAYBE */
    export const MAYBE = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255,25,0,0.2)', // slightly transparent red
        isWholeLine: true,
    })

    /** To indicate a hotspot with hotness NO */
    export const NO = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255,50,0,0.05)', // very transparent red
        isWholeLine: true,
    })

    /** Just a soft highlighting, e.g. to area affected by a suggestion */
    export const SOFT = vscode.window.createTextEditorDecorationType({
        // TODO improve this for light theme
        backgroundColor: 'rgba(255,255,255,0.05)',
        isWholeLine: true,
    })
}
