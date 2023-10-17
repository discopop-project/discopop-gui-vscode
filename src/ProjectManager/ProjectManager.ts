import * as vscode from 'vscode'
import { Project } from './Project'
import { ProjectManagerTreeItem } from './ProjectManagerTreeItem'
import { StorageManager } from '../misc/StorageManager'
import { StateManager } from '../misc/StateManager'

export class ProjectManager
    implements vscode.TreeDataProvider<ProjectManagerTreeItem>
{
    private static instance: ProjectManager

    private context: vscode.ExtensionContext
    private projectViewer: vscode.TreeView<ProjectManagerTreeItem> | undefined
    private projects: Project[] = []

    private constructor(context: vscode.ExtensionContext) {
        this.context = context
        this._restoreProjectsFromState()
    }

    static getInstance(context: vscode.ExtensionContext): ProjectManager {
        if (!ProjectManager.instance) {
            ProjectManager.instance = new ProjectManager(context)
        }
        ProjectManager.instance.refresh()
        return ProjectManager.instance
    }

    addProject(project: Project) {
        this.projects.push(project)
        this.refresh()
    }

    removeProject(project: Project) {
        this.projects = this.projects.filter((p) => p !== project)
        this.refresh()
    }

    getProjects(): Project[] {
        return this.projects
    }

    refresh(): void {
        if (this.projects.length === 0) {
            // 1) implicitly show no projects message (see package.json)

            // 2) get rid of the tree view
            this.projectViewer?.dispose()
            this.projectViewer = undefined

            // 3) remove projects from workspace state
            this.context.workspaceState.update('projects', undefined)
        } else {
            // 1) implicitly hide the no projects message (see package.json)

            // 2) create tree view
            this.projectViewer = vscode.window.createTreeView(
                'sidebar-projects-view',
                { treeDataProvider: this }
            )
            this.context.subscriptions.push(this.projectViewer)

            // 3) save projects to workspace state
            this._storeProjectsToState()
        }
        // update the tree view
        this._onDidChangeTreeData.fire()
    }

    private _restoreProjectsFromState(): void {
        const storedProjects = this.context.workspaceState.get(
            'projects'
        ) as any[]
        if (storedProjects) {
            this.projects = storedProjects.map((project) => {
                return Project.fromJSONObject(project)
            })
        } else {
            this.projects = []
        }
    }

    private _storeProjectsToState(): void {
        const projects = this.projects.map((project) => {
            return project.toJSONObject()
        })
        this.context.workspaceState.update('projects', projects)
    }

    // TreeDataProvider implementation:
    private _onDidChangeTreeData: vscode.EventEmitter<
        ProjectManagerTreeItem | undefined | null | void
    > = new vscode.EventEmitter<
        ProjectManagerTreeItem | undefined | null | void
    >()

    readonly onDidChangeTreeData: vscode.Event<
        ProjectManagerTreeItem | undefined | null | void
    > = this._onDidChangeTreeData.event

    getTreeItem(
        element: ProjectManagerTreeItem
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }

    getChildren(
        element?: ProjectManagerTreeItem
    ): vscode.ProviderResult<ProjectManagerTreeItem[]> {
        if (!element) {
            return this.getProjects()
        }
        return element.getChildren()
    }

    getParent(
        element: ProjectManagerTreeItem
    ): vscode.ProviderResult<ProjectManagerTreeItem> {
        return element.getParent()
    }

    //resolveTreeItem?(item: vscode.TreeItem, element: ProjectManagerTreeItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
    //    throw new Error("Method not implemented.")
    //}
}

// NOTES TO SELF:
// TODO
// https://code.visualstudio.com/api/extension-guides/tree-view
// https://github.com/microsoft/vscode-extension-samples/blob/main/tree-view-sample/src/ftpExplorer.ts
// https://code.visualstudio.com/api/extension-guides/command
