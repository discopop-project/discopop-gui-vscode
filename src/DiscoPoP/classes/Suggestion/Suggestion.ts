import { DiscoPoPCodeLens } from '../../../CodeLensProvider'

export abstract class Suggestion {
    applied: boolean = false

    constructor(
        public id: string,
        public fileId: number,
        public startLine: number,
        public endLine: number,
        public pragma: string,
        public pureJSONData: any
    ) {}

    getCodeLens(): DiscoPoPCodeLens {
        return new DiscoPoPCodeLens(this)
    }
}
