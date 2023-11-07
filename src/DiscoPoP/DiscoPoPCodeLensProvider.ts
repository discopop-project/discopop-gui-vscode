import * as vscode from 'vscode'
import { Config } from '../Utils/Config'
import { Suggestion } from './classes/Suggestion/Suggestion'
import { FileMapping } from '../FileMapping/FileMapping'
import { Commands } from '../Utils/Commands'
import { DefaultConfiguration } from '../ProjectManager/Configuration'
import { LineMapping } from '../LineMapping/LineMapping'

export class DiscoPoPCodeLens extends vscode.CodeLens {
    public constructor(
        fullConfiguration: DefaultConfiguration,
        suggestions: Suggestion[]
    ) {
        super(
            // TODO use the line_mapping
            new vscode.Range(
                suggestions[0].startLine - 1,
                0,
                suggestions[0].startLine - 1,
                0
            )
        )
        this.command = {
            title:
                `discovered potetential parallelism` +
                (suggestions.length > 1 ? ` (${suggestions.length})` : ''),
            command: Commands.applySuggestions,
            arguments: [fullConfiguration, suggestions],
        }
    }
}

export class DiscoPoPCodeLensProvider
    implements vscode.CodeLensProvider<DiscoPoPCodeLens>
{
    public hidden: boolean = false // TODO hide suggestions if disabled in settings, or if disabled in this editor

    // emitter and its event
    public _onDidChangeCodeLenses: vscode.EventEmitter<void> =
        new vscode.EventEmitter<void>()
    public readonly onDidChangeCodeLenses: vscode.Event<void> =
        this._onDidChangeCodeLenses.event

    constructor(
        private fileMapping: FileMapping,
        private lineMapping: LineMapping,
        private fullConfiguration: DefaultConfiguration,
        private suggestions: Suggestion[] = []
    ) {
        this.fileMapping = fileMapping
        this.lineMapping = lineMapping
        this.suggestions = suggestions
        this.fullConfiguration = fullConfiguration

        // update lenses when settings change (codeLenses visibility might have changed)
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire()
        })

        // update lenses when lineMapping changes
        this.lineMapping.onDidChangeLineMappingFile(() => {
            this._onDidChangeCodeLenses.fire()
        })
    }

    public provideCodeLenses(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
    ): DiscoPoPCodeLens[] | Thenable<DiscoPoPCodeLens[]> {
        const lenses = []
        if (Config.codeLensEnabled() && !this.hidden) {
            const fileId = this.fileMapping.getFileId(
                document.fileName.toString()
            )
            this.suggestions
                // only suggestions for this file
                .filter((suggestion) => {
                    return suggestion.fileId === fileId
                })
                // only suggestions that are not yet applied
                .filter((suggestion) => {
                    return !suggestion.applied
                })
                // map line numbers
                .map((suggestion) => {
                    suggestion.startLine = this.lineMapping.getMappedLine(
                        suggestion.fileId,
                        suggestion.startLine
                    )
                    suggestion.endLine = this.lineMapping.getMappedLine(
                        suggestion.fileId,
                        suggestion.endLine
                    )
                    return suggestion
                })
                // group by line
                .reduce((acc, suggestion) => {
                    const line = suggestion.startLine
                    if (acc.has(line)) {
                        acc.get(line).push(suggestion)
                    } else {
                        acc.set(line, [suggestion])
                    }
                    return acc
                }, new Map<Number, Suggestion[]>())
                // get CodeLens for each suggestion
                .forEach((suggestions, line) => {
                    lenses.push(
                        new DiscoPoPCodeLens(
                            this.fullConfiguration,
                            suggestions
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
        if (Config.codeLensEnabled) {
            return codeLens
        }
        return null
    }
}
