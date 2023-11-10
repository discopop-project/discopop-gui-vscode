import * as vscode from 'vscode'
import { Config } from '../Utils/Config'
import { Suggestion } from './classes/Suggestion/Suggestion'
import { FileMapping } from '../FileMapping/FileMapping'
import { Commands } from '../Utils/Commands'
import { DefaultConfiguration } from '../ProjectManager/Configuration'
import { LineMapping } from '../LineMapping/LineMapping'
import { DiscoPoPAppliedSuggestionsWatcher } from './DiscoPoPAppliedSuggestionsWatcher'

export class DiscoPoPCodeLens extends vscode.CodeLens {
    public constructor(
        private dotDiscoPoP: string,
        private suggestions: Suggestion[],
        line: number
    ) {
        super(new vscode.Range(line - 1, 0, line - 1, 0))
    }

    public resolve(): this {
        this.command = {
            title:
                `discovered potetential parallelism` +
                (this.suggestions.length > 1
                    ? ` (${this.suggestions.length})`
                    : ''),
            command: Commands.applySuggestions,
            arguments: [this.dotDiscoPoP, this.suggestions],
        }
        return this
    }
}

export class DiscoPoPCodeLensProvider
    implements vscode.CodeLensProvider<DiscoPoPCodeLens>
{
    public hidden: boolean = false // TODO hide suggestions if disabled in settings, or if disabled in this editor
    private suggestionsByFileId: Map<number, Suggestion[]>

    // hide codelenses while we wait for the lineMapping and appliedStatus to be updated
    private waitForLineMapping: boolean = false
    private waitForAppliedStatus: boolean = false
    private progress: vscode.Progress<{
        message?: string
        increment?: number
    }> = undefined
    private resolveProgress: () => void = undefined

    // emitter and its event
    public _onDidChangeCodeLenses: vscode.EventEmitter<void> =
        new vscode.EventEmitter<void>()
    public readonly onDidChangeCodeLenses: vscode.Event<void> =
        this._onDidChangeCodeLenses.event

    constructor(
        private fileMapping: FileMapping,
        private lineMapping: LineMapping,
        private appliedStatus: DiscoPoPAppliedSuggestionsWatcher,
        private dotDiscoPoP: string,
        suggestions: Suggestion[] = []
    ) {
        this.fileMapping = fileMapping
        this.lineMapping = lineMapping
        this.suggestionsByFileId = suggestions.reduce((acc, suggestion) => {
            if (acc.has(suggestion.fileId)) {
                acc.get(suggestion.fileId).push(suggestion)
            } else {
                acc.set(suggestion.fileId, [suggestion])
            }
            return acc
        }, new Map<number, Suggestion[]>())

        // update lenses when settings change (codeLenses visibility might have changed)
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire()
        })

        // update lenses when lineMapping changes
        this.lineMapping.onDidChange(() => {
            this.stopWaitingForLineMapping()
        })

        // update lenses when appliedStatus changes
        this.appliedStatus.onDidChange(() => {
            this.stopWaitingForAppliedStatus()
        })
    }

    /**
     * hides all suggestions and waits for the lineMapping and appliedStatus to be updated.
     * Only then shows the suggestions again.
     */
    public wait(waitForLineMapping = true, waitForAppliedStatus = true) {
        this.waitForLineMapping = waitForLineMapping
        this.waitForAppliedStatus = waitForAppliedStatus
        this._onDidChangeCodeLenses.fire()

        // indicate to the user that we are recomputing the codelenses
        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Window,
                title: 'DiscoPoP: Recomputing CodeLenses',
                cancellable: false,
            },
            (progress, token) => {
                // if the user applies suggestions very quickly by using the tree view we hide the previous progress bar
                this.progress?.report({
                    message: 'another suggestion was applied',
                    increment: 100,
                })
                this.resolveProgress?.()

                this.progress = progress
                return new Promise<void>((resolve, reject) => {
                    this.resolveProgress = resolve
                })
            }
        )
    }

    public stopWaitingForLineMapping() {
        this.waitForLineMapping = false
        this.progress?.report({ message: 'lineMapping updated', increment: 50 })
        this._updateIfWaitingFinised()
    }

    public stopWaitingForAppliedStatus() {
        this.waitForAppliedStatus = false
        this.progress?.report({
            message: 'appliedStatus updated',
            increment: 50,
        })
        this._updateIfWaitingFinised()
    }

    private _updateIfWaitingFinised() {
        if (!this.waitForLineMapping && !this.waitForAppliedStatus) {
            this.resolveProgress?.()
            this._onDidChangeCodeLenses.fire()
        }
    }

    public provideCodeLenses(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
    ): DiscoPoPCodeLens[] | Thenable<DiscoPoPCodeLens[]> {
        const lenses = []
        if (
            Config.codeLensEnabled() &&
            !this.hidden &&
            !this.waitForLineMapping &&
            !this.waitForAppliedStatus
        ) {
            const fileId = this.fileMapping.getFileId(
                document.fileName.toString()
            )
            this.suggestionsByFileId
                .get(fileId)
                // only suggestions that are not yet applied
                .filter((suggestion) => {
                    return !this.appliedStatus.isApplied(suggestion.id)
                })
                // group by line
                .reduce((acc, suggestion) => {
                    if (
                        acc.has(suggestion.getMappedStartLine(this.lineMapping))
                    ) {
                        acc.get(
                            suggestion.getMappedStartLine(this.lineMapping)
                        ).push(suggestion)
                    } else {
                        acc.set(
                            suggestion.getMappedStartLine(this.lineMapping),
                            [suggestion]
                        )
                    }
                    return acc
                }, new Map<number, Suggestion[]>())
                // get CodeLens for each suggestion
                .forEach((suggestions, line) => {
                    lenses.push(
                        new DiscoPoPCodeLens(
                            this.dotDiscoPoP,
                            suggestions,
                            line
                        )
                    )
                })
        }
        return lenses
    }

    public resolveCodeLens(
        codeLens: DiscoPoPCodeLens,
        token: vscode.CancellationToken
    ) {
        if (Config.codeLensEnabled()) {
            return codeLens.resolve()
        }
        return null
    }
}
