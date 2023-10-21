import * as vscode from 'vscode'
import {
    CancellationToken,
    CodeLens,
    Command,
    Position,
    Range,
    SnippetString,
    TextDocument,
    window,
} from 'vscode'
import { Commands } from './Commands'
import { Config } from './Config'
import {
    Suggestion,
    DoAllSuggestion,
    ReductionSuggestion,
    AppliedStatus,
    SuggestionType,
    FileMapping,
} from './misc/DiscoPoPParser'
import SnippetBuilder from './misc/SnippetBuilder'
import { StateManager } from './misc/StateManager'

export default class CodeLensProvider implements vscode.CodeLensProvider {
    public hidden: boolean = false
    private suggestions: Suggestion[] = []
    private fileMapping: FileMapping

    // emitter and its event
    public _onDidChangeCodeLenses: vscode.EventEmitter<void> =
        new vscode.EventEmitter<void>()
    public readonly onDidChangeCodeLenses: vscode.Event<void> =
        this._onDidChangeCodeLenses.event

    constructor(fileMapping: FileMapping, suggestions: Suggestion[]) {
        console.log('constructed codelensprovider')
        this.fileMapping = fileMapping
        this.suggestions = suggestions

        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire()
        })
    }

    public provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        if (Config.codeLensEnabled && !this.hidden) {
            console.log(
                'looking for lenses: in ' + document.fileName.toString()
            )
            console.log('  filemapping: ' + this.fileMapping)
            console.log(
                '  fmap.getFileID(): ' +
                    this.fileMapping.getFileId(document.fileName.toString())
            )
            console.log('  suggestions: ' + this.suggestions)
            // const recommendationIDs = StateManager.read(this.context, document.fileName.toString())

            // if (!recommendationIDs) {
            //     return []
            // }

            // const parsedRecommendationIds = JSON.parse(recommendationIDs)
            // if (!parsedRecommendationIds && !parsedRecommendationIds.length) {
            //     return []
            // }

            // this.suggestions = parsedRecommendationIds.map((recommendationID) => {
            //     // get recommendation from state
            //     let recommendationJSON = StateManager.read(this.context, recommendationID)
            //     if (recommendationJSON) {
            //         let recommendation: Suggestion = JSON.parse(recommendationJSON)
            //         if (
            //             recommendation &&
            //             recommendation.status !== AppliedStatus.APPLIED
            //         ) {
            //             return recommendation
            //         }
            //     }
            //     return
            // })

            // if (!this.suggestions) {
            //     return []
            // }

            // this.suggestions = this.suggestions.filter(
            //     (elem) => elem?.id
            // )

            // this.codeLenses = this.suggestions.map((recommendation) =>
            //     recommendation.getCodeLens()
            // )

            // return this.codeLenses

            const lenses = this.suggestions
                // only suggestions for this file
                .filter((suggestion) => {
                    const fileId = this.fileMapping.getFileId(
                        document.fileName.toString()
                    )
                    return suggestion.fileId === fileId
                })
                // only suggestions that are not yet applied
                .filter((suggestion) => {
                    return suggestion.status !== AppliedStatus.APPLIED
                })
                // get CodeLens for each suggestion
                .map((suggestion) => suggestion.getCodeLens())

            console.log(lenses)

            return lenses
        }
        return []
    }

    public resolveCodeLens(
        codeLens: vscode.CodeLens,
        token: vscode.CancellationToken
    ) {
        if (Config.codeLensEnabled) {
            return codeLens
        }
        return null
    }

    public insertRecommendation = async (recommendationId) => {
        const recommendation = this.suggestions?.find(
            (elem) => elem.id === recommendationId
        )

        if (!recommendation) {
            return
        }

        this._insertSnippet(recommendation)
        this._moveOtherRecommendations(recommendation)
        recommendation.status = AppliedStatus.APPLIED

        // StateManager.save(this.context, recommendation.id, recommendation)

        // vscode.commands.executeCommand(Commands.sendToDetail, [
        //     recommendation.id,
        // ])
    }

    private _moveOtherRecommendations = (
        removedRecommendation,
        offset: number = 1
    ) => {
        this.suggestions.map((recommendation) => {
            if (recommendation.id === removedRecommendation.id) {
                return
            }
            if (recommendation.startLine > removedRecommendation.startLine) {
                if (recommendation.startLine) {
                    recommendation.startLine += offset
                }
                if (recommendation.line) {
                    recommendation.line += offset
                }
                if (recommendation.endLine) {
                    recommendation.endLine += offset
                }
                // StateManager.save(
                //     this.context,
                //     recommendation.id,
                //     recommendation
                // )
            }
        })
        this._onDidChangeCodeLenses.fire()
    }

    private _insertSnippet = (result) => {
        if (
            result.resultType !== SuggestionType.DOALL ||
            result.resultType !== SuggestionType.REDUCTION
        ) {
            throw new Error(
                'This pattern type is not yet implemented: ' + result.resultType
            )
        }
        const editor = vscode.window.activeTextEditor

        if (editor) {
            editor.edit((editBuilder) => {
                editBuilder.insert(
                    new Position(result.startLine - 1, 0),
                    SnippetBuilder.buildSnippet(result)
                )
            })
        }
    }
}
