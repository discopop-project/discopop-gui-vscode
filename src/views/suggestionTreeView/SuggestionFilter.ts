import * as vscode from 'vscode'
import { CombinedSuggestion } from '../../resultStore/CombinedSuggestion'

export class SuggestionFilter implements vscode.QuickPickItem {
    public constructor(
        private readonly _filter: (s: CombinedSuggestion) => boolean,
        private _state: 'apply' | 'apply inversed',
        private _label: string,
        private _labelInversed: string,
        private _description?: string,
        private _descriptionInversed?: string
    ) {}

    public toggleInverted() {
        this._state = this._state === 'apply' ? 'apply inversed' : 'apply'
    }

    public get label() {
        return this._state === 'apply' ? this._label : this._labelInversed
    }

    public get description() {
        return this._state === 'apply'
            ? this._description
            : this._descriptionInversed
    }

    public get filter() {
        return this._state === 'apply' ? this._filter : (s) => !this._filter(s)
    }

    public buttons = [
        {
            iconPath: new vscode.ThemeIcon('extensions-sync-enabled'),
            tooltip: 'Invert Filter',
        },
    ]
}
