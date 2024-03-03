import * as vscode from 'vscode'
import { Settings as ISettings } from './discopopExtension/DiscopopExtension'

export class Settings implements ISettings {
    public constructor() {}

    get skipConfirmation(): {
        applyRollbackSuggestion: boolean
        overwriteBuild: boolean
    } {
        return {
            get applyRollbackSuggestion(): boolean {
                return Settings._getter(
                    'skipConfirmation.applyRollbackSuggestion',
                    false
                )
            },
            set applyRollbackSuggestion(value: boolean) {
                Settings._setter(
                    'skipConfirmation.applyRollbackSuggestion',
                    value
                )
            },
            get overwriteBuild(): boolean {
                return Settings._getter(
                    'skipConfirmation.overwriteBuild',
                    false
                )
            },
            set overwriteBuild(value: boolean) {
                Settings._setter('skipConfirmation.overwriteBuild', value)
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
                return Settings._getter('codeLens.enabled', true)
            },
            set enabled(value: boolean) {
                Settings._setter('codeLens.enabled', value)
            },
        }
    }
    set codeLens(value: { enabled: boolean }) {
        this.codeLens.enabled = value.enabled
    }

    get previewMode(): 'Peek' | 'Editor' {
        return Settings._getter('previewMode', 'Peek')
    }
    set previewMode(value: 'Peek' | 'Editor') {
        Settings._setter('previewMode', value)
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
