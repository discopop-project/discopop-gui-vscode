import * as fs from 'fs'
import * as vscode from 'vscode'
import { FileMapping } from '../FileMapping/FileMapping'
import { FileMappingParser } from '../FileMapping/FileMappingParser'
import ErrorHandler from '../Utils/ErrorHandler'
import {
    WithProgressOperation,
    WithProgressRunner,
} from '../Utils/WithProgressRunner'
import { Hotspot } from './classes/Hotspot'
import { HotspotDetectionResults } from './classes/HotspotDetectionResults'

export interface HotspotDetectionParserArguments {
    filemappingPath: string
    hotspotsJsonPath: string
}

export abstract class HotspotDetectionParser {
    private constructor() {
        throw new Error('This class should not be instantiated')
    }

    private static _parseHotspotsJsonFile(path: string): Hotspot[] {
        const str = fs.readFileSync(path, 'utf-8')
        return HotspotDetectionParser._parseHotspotsJsonString(str)
    }

    private static _parseHotspotsJsonString(text: string): Hotspot[] {
        const hotspots = JSON.parse(text)
        return HotspotDetectionParser._parseHotspotsJsonJSON(hotspots)
    }

    private static _parseHotspotsJsonJSON(json: any): Hotspot[] {
        // TODO validate the json object
        const hotspotList: Hotspot[] = []
        for (const hotspot of json.code_regions as any[]) {
            // read general fields
            const fid: number = hotspot.fid
            const lineNum: number = hotspot.lineNum
            const hotness: 'YES' | 'NO' | 'MAYBE' = hotspot.hotness
            const avr: number = hotspot.avr

            hotspotList.push(new Hotspot(fid, lineNum, hotness, avr, hotspot))
        }
        return hotspotList
    }

    public static async parse(
        args: HotspotDetectionParserArguments
    ): Promise<HotspotDetectionResults> {
        const steps: WithProgressOperation[] = []

        let fileMapping: FileMapping | undefined = undefined
        let hotspots: Hotspot[] | undefined = undefined

        steps.push({
            message: 'FileMapping',
            increment: 5,
            operation: async () => {
                fileMapping = FileMappingParser.parseFile(args.filemappingPath)
            },
        })

        steps.push({
            message: 'Hotspots',
            increment: 5,
            operation: async () => {
                hotspots = HotspotDetectionParser._parseHotspotsJsonFile(
                    args.hotspotsJsonPath
                )
            },
        })

        const withProgressRunner = new WithProgressRunner(
            'Parsing Hotspot Detection Results',
            vscode.ProgressLocation.Notification,
            false,
            steps,
            ErrorHandler
        )

        await withProgressRunner.run()
        return new HotspotDetectionResults(fileMapping, hotspots)
    }
}
