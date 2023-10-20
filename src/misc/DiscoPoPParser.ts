import * as vscode from 'vscode'
import * as fs from 'fs'

export enum SuggestionType {
    DOALL = 'doall',
    REDUCTION = 'reduction',
}

export enum AppliedStatus {
    APPLIED = 'applied',
    NEW = 'new',
}

export abstract class Suggestion {
    resultType: SuggestionType
    status: AppliedStatus

    id: string
    fileId: number
    line: number
    startLine: number
    endLine: number
    pragma: string

    abstract getCodeLens(): vscode.CodeLens
}

export class ReductionSuggestion extends Suggestion {
    priv: string[]
    shared: string[]
    firstPrivate: string[]
    reduction: string[]
    lastPrivate: string[]

    // TODO duplicate code
    getCodeLens(): vscode.CodeLens {
        const codeLens = new vscode.CodeLens(
            new vscode.Range(this.startLine - 1, 0, this.startLine - 1, 0),
            {
                title: `REDUCTION recommended with pragma: ${this.pragma}. Click to insert.`,
                command: 'discopop.codelensAction',
                arguments: [
                    this.id,
                    this.fileId,
                    this.startLine,
                    this.resultType,
                ],
            }
        )

        return codeLens
    }
}

export class DoAllSuggestion extends Suggestion {
    iterations: number
    instructions: number
    workload: number
    priv: string[]
    shared: string[]
    firstPrivate: string[]
    reduction: string[]
    lastPrivate: string[]

    // TODO duplicate code
    getCodeLens(): vscode.CodeLens {
        const codeLens = new vscode.CodeLens(
            new vscode.Range(this.startLine - 1, 0, this.startLine - 1, 0),
            {
                title: `DOALL recommended with pragma: ${this.pragma}. Click to insert.`,
                command: 'discopop.codelensAction',
                arguments: [
                    this.id,
                    this.fileId,
                    this.startLine,
                    this.resultType,
                ],
            }
        )

        return codeLens
    }
}

export class FileMapping {
    private fileMapping: Map<number, string> = new Map() // fileId -> filePath
    private inverseFileMapping: Map<string, number> = new Map() // filePath -> fileId

    public constructor(mapping: Map<number, string>) {
        this.fileMapping = mapping
        this.inverseFileMapping = new Map(
            Array.from(mapping, (entry) => [entry[1], entry[0]])
        )
    }

    public getFilePath(fileId: number): string {
        return this.fileMapping.get(fileId)
    }

    public getFileId(filePath: string): number {
        return this.inverseFileMapping.get(filePath)
    }

    public getAllFilePaths(): string[] {
        return Array.from(this.fileMapping.values())
    }

    public getAllFileIds(): number[] {
        return Array.from(this.inverseFileMapping.values())
    }

    /**
     * parses a FileMapping.txt file and returns a FileMapping object
     */
    public static parseFile(filePath: string): FileMapping {
        const fileMapping = fs
            .readFileSync(filePath, 'utf-8') // read file
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

        return new FileMapping(fileMapping)
    }
}

abstract class DiscoPoPParser {
    private constructor() {
        throw new Error('This class should not be instantiated')
    }
    public static async parseResultString() {
        // parse discoPoP result from state manager and apply it to existing treeView
        // the application to the treeview is made through appending them as result nodes
        // fetch patterns.json as string (from state manager or from file)
        // let resultString = ''
        // if (Config.scriptModeEnabled) {
        //     const storageManager = new StorageManager(this.context, true)
        //     resultString = (await storageManager.readFile(
        //         '.discopop/patterns.json',
        //         true
        //     )) as string
        // } else {
        //     const stateManager = new StateManager(this.context)
        //     resultString = stateManager.read('explorerResult')
        // }
        // const reductionRegex = new RegExp('Reduction at')
        // const doAllRegex = new RegExp('Do-all at')
        // resultString.split('\n').map((element, index, arr) => {
        //     if (reductionRegex.test(element.toString())) {
        //         this.parseReduction(arr, index)
        //     }
        //     if (doAllRegex.test(element.toString())) {
        //         this.parseDoAll(arr, index)
        //     }
        //     return
        // })
        // this.treeRoot = this.treeDataProvider.getCurrentTree()
        // this.appendResultsToTree(this.treeRoot)
        // this.treeDataProvider.forceTreeState(this.treeRoot)
    }

    // private appendResultsToTree = (root: TreeItem) => {
    //     if (root.id && (root.active || Config.scriptModeEnabled) && this.results[root.id]?.children?.length > 0) {
    //         this.saveIdsToStateManagerToRetrieveInCodeLensProvider(root)

    //         root.children = this.results[root.id].children
    //         root.collapsibleState = TreeItemCollapsibleState.Expanded
    //         return
    //     }
    //     if (root.children) {
    //         root.children.map((child) => this.appendResultsToTree(child))
    //     }
    //     return
    // }

    // // todo decouple
    // private saveIdsToStateManagerToRetrieveInCodeLensProvider = (root) => {
    //     const treePath = TreeUtils.getPathById(
    //         this.treeRoot.children,
    //         root.id,
    //         Config.getWorkspacePath()
    //     )

    //     const ids = this.results[root.id].children.map(
    //         (elem) => elem.resultIdentifier
    //     )

    //     const stateManager = new StateManager(this.context)
    //     stateManager.save(treePath, JSON.stringify(ids))
    // }

    // private pushItemToResults = (item, fileId) => {
    //     if (this.results[fileId] && this.results[fileId].children) {
    //         this.results[fileId].children.push(item)
    //     } else {
    //         this.results[fileId] = {
    //             children: [item],
    //         }
    //     }
    // }

    // private saveResultToState = (result) => {
    //     const stateManager = new StateManager(this.context)
    //     stateManager.save(result.id, JSON.stringify(result))
    // }

    // private addSendToDetailOnClickCommand = (item, id) => {
    //     item.command = {
    //         title: 'Display Result',
    //         command: Commands.sendToDetail,
    //         arguments: [id],
    //     }
    // }

    // private parseDoAll = (lines, index: number) => {
    //     const firstLine = lines[index].split(':')

    //     const fileId = parseInt(firstLine[firstLine.length - 2].substr(1))

    //     const line = parseInt(firstLine[firstLine.length - 1])

    //     const startLine = parseInt(
    //         lines[index + 1].split(':')[firstLine.length - 1]
    //     )

    //     const endLine = parseInt(
    //         lines[index + 2].split(':')[firstLine.length - 1]
    //     )

    //     const numberPattern = /\d+/g

    //     const iterations = parseInt(lines[index + 3].match(numberPattern)[0])

    //     const instructions = parseInt(lines[index + 4].match(numberPattern)[0])

    //     const workload = parseInt(lines[index + 5].match(numberPattern)[0])

    //     const pragma = this.parseDoAllPragma(lines[index + 6])

    //     const priv = this.parseArray(lines[index + 7])

    //     const shared = this.parseArray(lines[index + 8])

    //     const firstPrivate = this.parseArray(lines[index + 9])

    //     const reduction = this.parseArray(lines[index + 10])

    //     const lastPrivate = this.parseArray(lines[index + 11])

    //     const doAllResult: IDoAll = {
    //         id: new ObjectID().toString(),
    //         status: ResultStatus.New,
    //         resultType: ResultType.DoAll,
    //         fileId,
    //         line,
    //         startLine,
    //         endLine,
    //         iterations,
    //         instructions,
    //         workload,
    //         pragma,
    //         priv,
    //         shared,
    //         firstPrivate,
    //         reduction,
    //         lastPrivate,
    //     }

    //     this.saveResultToState(doAllResult)

    //     let treeItem = new TreeItem(Utils.getResultLabel(doAllResult.resultType, doAllResult.startLine))

    //     treeItem.contextValue = ItemType.Result
    //     treeItem.collapsibleState = TreeItemCollapsibleState.None
    //     treeItem.resultIdentifier = doAllResult.id
    //     treeItem.startLine = doAllResult.startLine

    //     this.addSendToDetailOnClickCommand(treeItem, doAllResult.id)

    //     this.pushItemToResults(treeItem, fileId)
    // }

    // private parseReduction = (lines, index) => {
    //     const firstLine = lines[index].split(':')

    //     const fileId = parseInt(firstLine[firstLine.length - 2].substr(1))

    //     const line = parseInt(firstLine[firstLine.length - 1])

    //     const startLine = parseInt(
    //         lines[index + 1].split(':')[firstLine.length - 1]
    //     )

    //     const endLine = parseInt(
    //         lines[index + 2].split(':')[firstLine.length - 1]
    //     )

    //     const pragma = this.parseReductionPragma(lines[index + 3])

    //     const priv = this.parseArray(lines[index + 4])

    //     const shared = this.parseArray(lines[index + 5])

    //     const firstPrivate = this.parseArray(lines[index + 6])

    //     const reduction = this.parseArray(lines[index + 7])

    //     const lastPrivate = this.parseArray(lines[index + 8])

    //     const reductionResult: IReduction = {
    //         id: new ObjectID().toString(),
    //         status: ResultStatus.New,
    //         resultType: ResultType.Reduction,
    //         fileId,
    //         line,
    //         startLine,
    //         endLine,
    //         pragma,
    //         priv,
    //         shared,
    //         firstPrivate,
    //         reduction,
    //         lastPrivate,
    //     }

    //     this.saveResultToState(reductionResult)

    //     let treeItem = new TreeItem(Utils.getResultLabel(reductionResult.resultType, reductionResult.startLine))

    //     treeItem.contextValue = ItemType.Result
    //     treeItem.collapsibleState = TreeItemCollapsibleState.None
    //     treeItem.resultIdentifier = reductionResult.id
    //     treeItem.startLine = reductionResult.startLine

    //     this.addSendToDetailOnClickCommand(treeItem, reductionResult.id)

    //     this.pushItemToResults(treeItem, fileId)
    // }

    // !!! CAUTION !!!
    // Do-all pragma example: pragma: "#pragma omp parallel for"
    // Reduction pragma example: pragma: #pragma omp parallel for
    // why you do this to me :(?
    // private parseDoAllPragma = (line): string => {
    //     // match for string which is inside two quotes
    //     const regex = new RegExp('"[^"]*"', 'g')

    //     const match = line.match(regex)

    //     if (!match.length) {
    //         return ''
    //     }

    //     return match[0].slice(1, -1)
    // }

    // private parseReductionPragma = (line): string => {
    //     const regex = new RegExp('#(.*)', 'g')

    //     const match = line.match(regex)

    //     if (!match.length) {
    //         return ''
    //     }

    //     return match[0]
    // }

    // private parseArray = (line): Array<string> => {
    //     // match for all strings which are inside two single quotes
    //     const regex = new RegExp("'[^']*'", 'g')

    //     let result = []

    //     let match
    //     while ((match = regex.exec(line))) {
    //         result.push(match[0].slice(1, -1))
    //     }

    //     return result
    // }

    /* private parseGeometricDecomposition = (lines: []) => {

    }

    private parseTaskParallelism = (lines: []) => {

    }

    private parsePipeline = (lines: []) => {

    } */
}
