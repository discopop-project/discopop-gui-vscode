import * as fs from 'fs'
import { FileMapping } from './FileMapping'

/**
 * provides methods to parse the contents of a FileMapping.txt file
 */
export abstract class FileMappingParser {
    private constructor() {
        throw new Error('This class should not be instantiated')
    }

    /**
     * parses a FileMapping.txt file and returns a FileMapping object
     * @param filePath path to the FileMapping.txt file
     * @returns the FileMapping object
     */
    public static parseFile(path: string): FileMapping {
        const fileMappingString = fs.readFileSync(path, 'utf-8')
        return FileMappingParser.parseString(fileMappingString)
    }

    /**
     * given the contents of a FileMapping.txt file, returns a FileMapping object
     * @param fileMappingStr contents of a FileMapping.txt file
     * @returns the FileMapping object
     */
    public static parseString(fileMappingStr) {
        const map = fileMappingStr
            .split('\n') // split into lines
            .map((line) => line.trim()) // trim whitespace
            .filter((line) => line.length > 0) // remove empty lines
            .map((line) => line.split('\t')) // split into columns
            .map((line) => [parseInt(line[0]), line[1]] as [number, string]) // convert first column to int
            .reduce((map, entry) => {
                // convert to map
                map.set(entry[0], entry[1])
                return map
            }, new Map<number, string>())

        return new FileMapping(map)
    }
}
