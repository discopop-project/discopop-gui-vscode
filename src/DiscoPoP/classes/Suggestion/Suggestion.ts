import { DefaultConfiguration } from '../../../ProjectManager/Configuration'
import { DiscoPoPCodeLens } from '../../DiscoPoPCodeLensProvider'

export abstract class Suggestion {
    applied: boolean = false

    constructor(
        // parsed fields
        public id: number,
        public type: string,
        public fileId: number,
        public startLine: number,
        public endLine: number,
        // complete JSON data
        public pureJSONData: any
    ) {}
}
