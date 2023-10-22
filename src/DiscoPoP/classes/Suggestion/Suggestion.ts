import * as vscode from 'vscode'

export enum AppliedStatus {
    APPLIED = 'applied',
    NEW = 'new',
}

export abstract class Suggestion {
    status: AppliedStatus

    id: string
    fileId: number
    startLine: number
    endLine: number
    pragma: string

    pureJSONData: any

    constructor(
        id: string,
        fileId: number,
        startLine: number,
        endLine: number,
        pragma: string,
        pureJSONData: any
    ) {
        this.status = AppliedStatus.NEW

        this.id = id
        this.fileId = fileId
        this.startLine = startLine
        this.endLine = endLine
        this.pragma = pragma
        this.pureJSONData = pureJSONData
    }

    abstract getCodeLens(): vscode.CodeLens
    // abstract apply(otherSuggestions: Suggestion[]): void // TODO apply() ????
}
