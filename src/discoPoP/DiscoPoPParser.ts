import * as fs from 'fs'
import { FileMappingParser } from '../fileMapping/FileMappingParser'
import { LineMapping } from '../lineMapping/LineMapping'
import { DiscoPoPAppliedSuggestionsWatcher } from './DiscoPoPAppliedSuggestionsWatcher'
import { DiscoPoPPatternParser } from './DiscoPoPPatternParser'
import { DiscoPoPResults } from './classes/DiscoPoPResults'
import { Suggestion } from './classes/Suggestion/Suggestion'

export abstract class DiscoPoPParser {
    private constructor() {
        throw new Error('This class should not be instantiated')
    }

    public static async parse(dotDiscoPoP: string): Promise<DiscoPoPResults> {
        // parse FileMapping.txt
        let fileMapping = FileMappingParser.parseFile(
            `${dotDiscoPoP}/FileMapping.txt`
        )

        // parse patterns.json
        // use explorer/patterns.json by default
        let patternsJson = `${dotDiscoPoP}/explorer/patterns.json`
        // if optimizer/patterns.json exists, use it instead
        if (fs.existsSync(`${dotDiscoPoP}/optimizer/patterns.json`)) {
            patternsJson = `${dotDiscoPoP}/optimizer/patterns.json`
        }
        const suggestionsByType: Map<string, Suggestion[]> =
            DiscoPoPPatternParser.parseFile(patternsJson)

        // create LineMappingWatcher
        const lineMappingFile = `${dotDiscoPoP}/line_mapping.json`
        const lineMapping = new LineMapping(lineMappingFile)

        // create AppliedSuggestionsWatcher
        const appliedSuggestionsFile = `${dotDiscoPoP}/patch_applicator/applied_suggestions.json`
        const appliedStatus = new DiscoPoPAppliedSuggestionsWatcher(
            appliedSuggestionsFile
        )

        return new DiscoPoPResults(
            dotDiscoPoP,
            suggestionsByType!,
            fileMapping!,
            lineMapping!,
            appliedStatus!
        )
    }
}
