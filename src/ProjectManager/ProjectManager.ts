import * as vscode from 'vscode'
import { Project } from './Project'
import { ProjectManagerTreeItem } from './ProjectManagerTreeItem'

export class ProjectManager
    implements vscode.TreeDataProvider<ProjectManagerTreeItem>
{
    private static instance: ProjectManager
    private projects: Project[] = []

    private constructor() {}

    static getInstance(): ProjectManager {
        if (!ProjectManager.instance) {
            ProjectManager.instance = new ProjectManager()
        }
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

    // TreeDataProvider implementation:
    private _onDidChangeTreeData: vscode.EventEmitter<
        ProjectManagerTreeItem | undefined | null | void
    > = new vscode.EventEmitter<
        ProjectManagerTreeItem | undefined | null | void
    >()
    readonly onDidChangeTreeData: vscode.Event<
        ProjectManagerTreeItem | undefined | null | void
    > = this._onDidChangeTreeData.event

    static refresh(): void {
        this.getInstance()._onDidChangeTreeData.fire()
    }

    refresh(): void {
        this._onDidChangeTreeData.fire()
    }

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
