import * as vscode from 'vscode'
import { Settings } from './Settings'

export class VsCodeSettings implements Settings {
    public constructor() {}

    get skipConfirmation(): {
        applyRollbackSuggestion: boolean
        overwriteBuild: boolean
    } {
        return {
            get applyRollbackSuggestion(): boolean {
                return VsCodeSettings._getter(
                    'skipConfirmation.applyRollbackSuggestion',
                    false
                )
            },
            set applyRollbackSuggestion(value: boolean) {
                VsCodeSettings._setter(
                    'skipConfirmation.applyRollbackSuggestion',
                    value
                )
            },
            get overwriteBuild(): boolean {
                return VsCodeSettings._getter(
                    'skipConfirmation.overwriteBuild',
                    false
                )
            },
            set overwriteBuild(value: boolean) {
                VsCodeSettings._setter('skipConfirmation.overwriteBuild', value)
            },
        }
    }
    set skipConfirmation(value: {
        applyRollbackSuggestion: boolean
        overwriteBuild: boolean
    }) {
        this.skipConfirmation.applyRollbackSuggestion =
            value.applyRollbackSuggestion
        this.skipConfirmation.overwriteBuild = value.overwriteBuild
    }

    get codeLens(): { enabled: boolean } {
        return {
            get enabled(): boolean {
                return VsCodeSettings._getter('codeLens.enabled', true)
            },
            set enabled(value: boolean) {
                VsCodeSettings._setter('codeLens.enabled', value)
            },
        }
    }
    set codeLens(value: { enabled: boolean }) {
        this.codeLens.enabled = value.enabled
    }

    get previewMode(): 'Peek' | 'Editor' {
        return VsCodeSettings._getter('previewMode', 'Peek')
    }
    set previewMode(value: 'Peek' | 'Editor') {
        VsCodeSettings._setter('previewMode', value)
    }

    private static _getter(key: string, defaultValue: any): any {
        return vscode.workspace
            .getConfiguration('discopop')
            .get(key, defaultValue)
    }

    private static _setter(key: string, value: any): void {
        vscode.workspace
            .getConfiguration('discopop')
            .update(key, value, vscode.ConfigurationTarget.Global)
    }
}
