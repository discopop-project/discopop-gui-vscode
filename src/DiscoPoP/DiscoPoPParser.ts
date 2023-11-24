import * as vscode from 'vscode'
import { FileMapping } from '../FileMapping/FileMapping'
import { FileMappingParser } from '../FileMapping/FileMappingParser'
import { LineMapping } from '../LineMapping/LineMapping'
import ErrorHandler from '../Utils/ErrorHandler'
import {
    WithProgressOperation,
    WithProgressRunner,
} from '../Utils/WithProgressRunner'
import { DiscoPoPAppliedSuggestionsWatcher } from './DiscoPoPAppliedSuggestionsWatcher'
import { DiscoPoPPatternParser } from './DiscoPoPPatternParser'
import { DiscoPoPResults } from './classes/DiscoPoPResults'
import { Suggestion } from './classes/Suggestion/Suggestion'

export interface DiscoPoPParserArguments {
    dotDiscoPoP: string // TODO replace with only the necessary fields
}

export abstract class DiscoPoPParser {
    private constructor() {
        throw new Error('This class should not be instantiated')
    }

    public static async parse(
        args: DiscoPoPParserArguments
    ): Promise<DiscoPoPResults> {
        const steps: WithProgressOperation[] = []

        let fileMapping: FileMapping | undefined = undefined
        steps.push({
            message: 'Parsing FileMapping...',
            increment: 25,
            operation: async () => {
                fileMapping = FileMappingParser.parseFile(
                    `${args.dotDiscoPoP}/FileMapping.txt`
                )
            },
        })

        let suggestionsByType: Map<string, Suggestion[]> | undefined = undefined
        steps.push({
            message: 'Parsing suggestions...',
            increment: 25,
            operation: async () => {
                suggestionsByType = DiscoPoPPatternParser.parseFile(
                    `${args.dotDiscoPoP}/explorer/patterns.json`
                )
            },
        })

        let lineMapping: LineMapping | undefined = undefined
        steps.push({
            message: 'Synchronizing LineMapping...',
            increment: 25,
            operation: async () => {
                const lineMappingFile = `${args.dotDiscoPoP}/line_mapping.json`
                lineMapping = new LineMapping(lineMappingFile)
            },
        })

        let appliedStatus: DiscoPoPAppliedSuggestionsWatcher | undefined =
            undefined
        steps.push({
            message: 'Synchronizing applied status...',
            increment: 25,
            operation: async () => {
                const appliedSuggestionsFile = `${args.dotDiscoPoP}/patch_applicator/applied_suggestions.json`

                appliedStatus = new DiscoPoPAppliedSuggestionsWatcher(
                    appliedSuggestionsFile
                )
            },
        })

        const withProgressRunner = new WithProgressRunner(
            'Parsing DiscoPoP results',
            vscode.ProgressLocation.Notification,
            false, // TODO: true is currently NOT supported
            steps,
            ErrorHandler
        )

        await withProgressRunner.run()

        return new DiscoPoPResults(
            args.dotDiscoPoP,
            suggestionsByType!,
            fileMapping!,
            lineMapping!,
            appliedStatus!
        )
    }
}
