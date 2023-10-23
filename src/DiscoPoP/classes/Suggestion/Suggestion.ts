import * as vscode from 'vscode'
import { DiscoPoPCodeLens } from '../../../CodeLensProvider'

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

    getCodeLens(): DiscoPoPCodeLens {
        return new DiscoPoPCodeLens(this)
    }
}
