import { DiscoPoPCodeLens } from '../../DiscoPoPCodeLensProvider'

export abstract class Suggestion {
    applied: boolean = false

    constructor(
        // parsed fields
        public id: string,
        public fileId: number,
        public startLine: number,
        public endLine: number,
        public pragma: string,
        // complete JSON data
        public pureJSONData: any
    ) {}

    getCodeLens(): DiscoPoPCodeLens {
        return new DiscoPoPCodeLens(this)
    }
}
