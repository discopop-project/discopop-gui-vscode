import { CombinedDataDependency } from '../../resultStore/CombinedDataDependency'
import { TreeNode } from './TreeNode'
import { SimpleTree } from '../../utils/SimpleTree'
import { File } from './File'
import { Directory } from './Directory'
import * as vscode from 'vscode'

export class DataProvider extends SimpleTree<TreeNode> {
    protected _directoriesOrFiles: Map<string, TreeNode> = new Map<
        string,
        TreeNode
    >()
    protected _loadDependents(): void {
        for (const dependencies of this._combinedDataDependencies.values()) {
            for (const dependency of dependencies) {
                if (dependency.access !== 'INIT') {
                    continue
                }
                const directoryHierarchy = dependency.filePath.replace(
                    this._projectPath,
                    ''
                )

                if (
                    directoryHierarchy === '' ||
                    (this._projectPath &&
                        directoryHierarchy === dependency.filePath)
                ) {
                    console.error('could not find file for dependent')
                    continue
                }

                let nextInHierarchy = directoryHierarchy.split('/')

                if (nextInHierarchy[0] === '') {
                    nextInHierarchy = nextInHierarchy.slice(1)
                }

                if (nextInHierarchy.length < 1 || nextInHierarchy[0] === '') {
                    console.error('could not find file for dependent')
                    continue
                }

                let directoryOrFile = this._directoriesOrFiles.get(
                    nextInHierarchy[0]
                )

                if (!directoryOrFile) {
                    if (nextInHierarchy.length < 2) {
                        this._directoriesOrFiles.set(
                            nextInHierarchy[0],
                            new File(nextInHierarchy[0], this)
                        )
                    } else {
                        this._directoriesOrFiles.set(
                            nextInHierarchy[0],
                            new Directory(nextInHierarchy[0], this)
                        )
                    }

                    directoryOrFile = this._directoriesOrFiles.get(
                        nextInHierarchy[0]
                    )
                    this.roots.push(directoryOrFile)
                }

                if (directoryOrFile instanceof File) {
                    directoryOrFile.addDependent(dependency)
                } else if (directoryOrFile instanceof Directory) {
                    directoryOrFile.addDependent(
                        nextInHierarchy.slice(1),
                        dependency
                    )
                }
            }
        }

        this.roots.sort((a, b) => a.getName().localeCompare(b.getName()))
    }

    public constructor() {
        super([])
    }

    protected _projectPath: string | undefined = undefined
    protected _combinedDataDependencies:
        | Map<string, CombinedDataDependency[]>
        | undefined = undefined
    public update(
        combinedDataDependencies: Map<string, CombinedDataDependency[]>,
        projectPath: string
    ): void {
        this.roots = []
        this._combinedDataDependencies = combinedDataDependencies
        this._projectPath = projectPath
        this._directoriesOrFiles.clear()

        if (
            this._combinedDataDependencies !== undefined &&
            this._projectPath !== undefined
        ) {
            this._loadDependents()

            vscode.commands.executeCommand(
                'setContext',
                'discopop.dataDependentsAvailable',
                true
            )
        } else {
            vscode.commands.executeCommand(
                'setContext',
                'discopop.dataDependentsAvailable',
                false
            )
        }

        this.refresh()
    }

    public clear(): void {
        this._combinedDataDependencies = undefined
        this._projectPath = undefined
        this._directoriesOrFiles.clear()
        this.roots = []
        this.refresh()
    }

    public getCombinedDataDependencies(id: string): CombinedDataDependency[] {
        if (this._combinedDataDependencies === undefined) {
            return []
        }
        return this._combinedDataDependencies.get(id)
    }
}
