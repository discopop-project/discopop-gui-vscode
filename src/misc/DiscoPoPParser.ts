import { StateManager } from './StateManager'
import * as vscode from 'vscode'
import { StorageManager } from './StorageManager'
import { ItemType } from '../ItemType'
import { ResultType } from '../ResultType'
import { TreeDataProvider, TreeItem } from '../Provider/TreeDataProvider'
import { TreeItemCollapsibleState } from 'vscode'
import { ObjectID } from 'bson'
import { Commands } from '../Commands'
import { TreeUtils } from '../TreeUtils'
import { Config } from '../Config'
import { ResultStatus } from '../ResultStatus'
import Utils from '../Utils'

interface IBaseResult {
    id: string
    resultType: ResultType
    fileId: number

    status: ResultStatus
}

export interface IReduction extends IBaseResult {
    line: number
    startLine: number
    endLine: number
    pragma: string // maybe this will turn to enum strings or some form of mapping
    priv: string[]
    shared: string[]
    firstPrivate: string[]
    reduction: string[]
    lastPrivate: string[]
}

export interface IDoAll extends IBaseResult {
    line: number
    startLine: number
    endLine: number
    iterations: number
    instructions: number
    workload: number
    pragma: string
    priv: string[]
    shared: string[]
    firstPrivate: string[]
    reduction: string[]
    lastPrivate: string[]
}

export default class DiscoPoPParser {
    context: vscode.ExtensionContext
    treeDataProvider: TreeDataProvider
    treeRoot: TreeItem
    results

    constructor(
        context: vscode.ExtensionContext,
        treeDataProvider: TreeDataProvider
    ) {
        this.context = context
        this.treeDataProvider = treeDataProvider
        this.treeRoot = treeDataProvider.getCurrentTree()
        this.results = {}
    }
    parseResultString = async () => {
        // parse discoPoP result from state manager and apply it to existing treeView
        // the application to the treeview is made through appending them as result nodes

        // fetch patterns.json as string (from state manager or from file)
        let resultString = ''
        if (Config.scriptModeEnabled) {
            const storageManager = new StorageManager(this.context, true)
            resultString = (await storageManager.readFile(
                '.discopop/patterns.json',
                true
            )) as string
        } else {
            const stateManager = new StateManager(this.context)
            resultString = stateManager.read('explorerResult')
        }

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
