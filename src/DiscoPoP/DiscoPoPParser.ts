import * as vscode from 'vscode'
import * as fs from 'fs'
import { FileMapping } from '../FileMapping/FileMapping'
import { FileMappingParser } from '../FileMapping/FileMappingParser'
import { LineMapping } from '../LineMapping/LineMapping'
import {
    WithProgressOperation,
    WithProgressRunner,
} from '../Utils/WithProgressRunner'
import { DiscoPoPAppliedSuggestionsWatcher } from './DiscoPoPAppliedSuggestionsWatcher'
import { DiscoPoPPatternParser } from './DiscoPoPPatternParser'
import { DiscoPoPResults } from './classes/DiscoPoPResults'
import { Suggestion } from './classes/Suggestion/Suggestion'

export abstract class DiscoPoPParser {
    private constructor() {
        throw new Error('This class should not be instantiated')
    }

    public static async parse(dotDiscoPoP: string): Promise<DiscoPoPResults> {
        const steps: WithProgressOperation[] = []

        let fileMapping: FileMapping | undefined = undefined
        steps.push({
            message: 'Parsing FileMapping...',
            increment: 25,
            operation: async () => {
                fileMapping = FileMappingParser.parseFile(
                    `${dotDiscoPoP}/FileMapping.txt`
                )
            },
        })

        let suggestionsByType: Map<string, Suggestion[]> | undefined = undefined
        steps.push({
            message: 'Parsing suggestions...',
            increment: 25,
            operation: async () => {
                // use explorer/patterns.json by default
                let patternsJson = `${dotDiscoPoP}/explorer/patterns.json`
                // if optimizer/patterns.json exists, use it instead
                if (fs.existsSync(`${dotDiscoPoP}/optimizer/patterns.json`)) {
                    patternsJson = `${dotDiscoPoP}/optimizer/patterns.json`
                }

                suggestionsByType =
                    DiscoPoPPatternParser.parseFile(patternsJson)
            },
        })

        let lineMapping: LineMapping | undefined = undefined
        steps.push({
            message: 'Synchronizing LineMapping...',
            increment: 25,
            operation: async () => {
                const lineMappingFile = `${dotDiscoPoP}/line_mapping.json`
                lineMapping = new LineMapping(lineMappingFile)
            },
        })

        let appliedStatus: DiscoPoPAppliedSuggestionsWatcher | undefined =
            undefined
        steps.push({
            message: 'Synchronizing applied status...',
            increment: 25,
            operation: async () => {
                const appliedSuggestionsFile = `${dotDiscoPoP}/patch_applicator/applied_suggestions.json`

                appliedStatus = new DiscoPoPAppliedSuggestionsWatcher(
                    appliedSuggestionsFile
                )
            },
        })

        const withProgressRunner = new WithProgressRunner(
            'Parsing DiscoPoP results',
            vscode.ProgressLocation.Notification,
            false, // TODO: true is currently NOT supported
            steps
        )

        await withProgressRunner.run()

        return new DiscoPoPResults(
            dotDiscoPoP,
            suggestionsByType!,
            fileMapping!,
            lineMapping!,
            appliedStatus!
        )
    }
}
