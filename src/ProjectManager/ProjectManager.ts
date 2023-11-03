import * as vscode from 'vscode'
import { Project } from './Project'
import { ProjectManagerTreeItem } from './ProjectManagerTreeItem'
import { Commands } from '../Utils/Commands'
import { UIPrompts } from '../Utils/UIPrompts'
import { Configuration } from './Configuration'
import { ConfigurationItem } from './ConfigurationItem'

export class ProjectManager
    implements vscode.TreeDataProvider<ProjectManagerTreeItem>
{
    private static instance: ProjectManager | undefined

    private context: vscode.ExtensionContext
    private projectViewer: vscode.TreeView<ProjectManagerTreeItem> | undefined
    private projects: Project[] = []

    private constructor(context: vscode.ExtensionContext) {
        this.context = context
        this._registerCommands()
        this._restoreProjectsFromState()
    }

    static load(context: vscode.ExtensionContext): void {
        if (!ProjectManager.instance) {
            ProjectManager.instance = new ProjectManager(context)
        }
        ProjectManager.refresh()
        // return ProjectManager.instance
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

    static refresh() {
        ProjectManager.instance?.refresh()
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

    private _registerCommands(): void {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(Commands.addProject, async () => {
                // query the user for all the necessary information
                const steps = 7
                const projectName = await UIPrompts.genericInputBoxQuery(
                    'Create Project',
                    'Please enter the project name',
                    1,
                    steps
                )
                const projectPath = await UIPrompts.genericOpenDialogQuery(
                    'Create Project',
                    'Please select the project path',
                    2,
                    steps
                )
                const executableName = await UIPrompts.genericInputBoxQuery(
                    'Create Project',
                    'Please enter the executable name',
                    3,
                    steps
                )
                const executableArgumentsDiscoPoP =
                    await UIPrompts.genericInputBoxQuery(
                        'Create Project',
                        'Please enter the executable arguments that should be used for the DiscoPoP instrumentation',
                        4,
                        steps
                    )
                const executableArgumentsHotspotDetection = []
                executableArgumentsHotspotDetection.push(
                    await UIPrompts.genericInputBoxQuery(
                        'Create Project',
                        `Please enter the executable arguments that should be used for run ${
                            executableArgumentsHotspotDetection.length + 1
                        } of the Hotspot Detection instrumentation`,
                        5,
                        steps
                    )
                )
                let wantsToContinue: boolean = true
                while (
                    (wantsToContinue = await UIPrompts.actionConfirmed(
                        'Do you want to add another run of the Hotspot Detection instrumentation?'
                    ))
                ) {
                    executableArgumentsHotspotDetection.push(
                        await UIPrompts.genericInputBoxQuery(
                            'Create Project',
                            `Please enter the executable arguments that should be used for run ${
                                executableArgumentsHotspotDetection.length + 1
                            } of the Hotspot Detection instrumentation`,
                            5,
                            steps
                        )
                    )
                }
                const buildDirectory = await UIPrompts.genericOpenDialogQuery(
                    'Create Project',
                    'Please enter the build directory',
                    6,
                    steps
                )
                const cmakeArguments = await UIPrompts.genericInputBoxQuery(
                    'Create Project',
                    'Please enter the CMake arguments',
                    7,
                    steps
                )

                // create and add the project to the project manager
                const project = new Project(
                    projectName,
                    projectPath,
                    executableName,
                    executableArgumentsDiscoPoP,
                    executableArgumentsHotspotDetection,
                    buildDirectory,
                    cmakeArguments
                )
                this.addProject(project)
            })
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.addConfiguration,
                async (project: Project) => {
                    const totalSteps = 6

                    // let the user specify the name of the configuration
                    const configurationName =
                        await UIPrompts.genericInputBoxQuery(
                            'Create Configuration',
                            'Please enter the name of the configuration',
                            1,
                            totalSteps
                        )

                    // let the user select a directory
                    const projectPath = await UIPrompts.genericOpenDialogQuery(
                        'Create Configuration',
                        'Please select the project directory',
                        2,
                        totalSteps
                    )

                    // let the user specify the executable name
                    const executableName = await UIPrompts.genericInputBoxQuery(
                        'Create Configuration',
                        'Please enter the name of the executable',
                        3,
                        totalSteps
                    )

                    // let the user specify the arguments for the executable (DiscoPoP)
                    const executableArgumentsDiscoPoP =
                        await UIPrompts.genericInputBoxQuery(
                            'Create Configuration',
                            'Please enter the arguments for the executable',
                            4,
                            totalSteps
                        )

                    // let the user specify the arguments for the executable (Hotspot Detection)
                    // TODO duplicate code starts here
                    const executableArgumentsHotspotDetection = []
                    executableArgumentsHotspotDetection.push(
                        await UIPrompts.genericInputBoxQuery(
                            'Create Project',
                            `Please enter the executable arguments that should be used for run ${
                                executableArgumentsHotspotDetection.length + 1
                            } of the Hotspot Detection instrumentation`,
                            5,
                            totalSteps
                        )
                    )
                    let wantsToContinue: boolean = true
                    while (
                        (wantsToContinue = await UIPrompts.actionConfirmed(
                            'Do you want to add another run of the Hotspot Detection instrumentation?'
                        ))
                    ) {
                        executableArgumentsHotspotDetection.push(
                            await UIPrompts.genericInputBoxQuery(
                                'Create Project',
                                `Please enter the executable arguments that should be used for run ${
                                    executableArgumentsHotspotDetection.length +
                                    1
                                } of the Hotspot Detection instrumentation`,
                                5,
                                totalSteps
                            )
                        )
                    }
                    // TODO duplicate code ends here

                    // let the user specify the build directory
                    const buildDirectory =
                        await UIPrompts.genericOpenDialogQuery(
                            'Create Configuration',
                            'Please select the build directory',
                            5,
                            totalSteps
                        ) // TODO the openDialog only allows to open existing directories, we need to be able to create new directories too
                    // TODO default to projectPath/build

                    // let the user specify the cmake arguments
                    const cmakeArguments = await UIPrompts.genericInputBoxQuery(
                        'Create Configuration',
                        'Please enter the cmake arguments',
                        6,
                        totalSteps
                    )

                    // create the configuration
                    const configuration = new Configuration(
                        configurationName,
                        projectPath,
                        executableName,
                        executableArgumentsDiscoPoP,
                        executableArgumentsHotspotDetection,
                        buildDirectory,
                        cmakeArguments
                    )

                    // add the configuration to the project
                    project.addConfiguration(configuration)
                    this.refresh()
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.removeProject,
                async (project: Project) => {
                    if (
                        await UIPrompts.actionConfirmed(
                            'Are you sure you want to remove this project?'
                        )
                    ) {
                        this.removeProject(project)
                    }
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.renameProject,
                async (project: Project) => {
                    const value = await vscode.window.showInputBox({
                        prompt: 'Please enter the new name of the project',
                        value: project.getName(),
                    })
                    if (value) {
                        project.setName(value)
                        this.refresh()
                    }
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.renameConfiguration,
                async (configuration: Configuration) => {
                    const value = await vscode.window.showInputBox({
                        prompt: 'Please enter the new name of the Configuration',
                        value: configuration.getName(),
                    })

                    if (value) {
                        configuration.setName(value)
                        this.refresh()
                    }
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.copyConfiguration,
                async (configuration: Configuration) => {
                    const value = await vscode.window.showInputBox({
                        prompt: 'Please enter the name of the new Configuration',
                        value: configuration.getName() + ' (copy)',
                    })
                    if (value) {
                        const newConfiguration = new Configuration(
                            value,
                            configuration.getProjectPath(),
                            configuration.getExecutableName(),
                            configuration.getExecutableArgumentsDiscoPoP(),
                            configuration.getExecutableArgumentsHotspotDetection(),
                            configuration.getBuildDirectory(),
                            configuration.getCMakeArguments()
                        )
                        configuration
                            .getParent()
                            ?.addConfiguration(newConfiguration)
                        this.refresh()
                    }
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.removeConfiguration,
                async (configuration: Configuration) => {
                    if (
                        await UIPrompts.actionConfirmed(
                            'Are you sure you want to remove this configuration?'
                        )
                    ) {
                        configuration
                            .getParent()
                            ?.removeConfiguration(configuration)
                        this.refresh()
                    }
                }
            )
        )

        this.context.subscriptions.push(
            vscode.commands.registerCommand(
                Commands.editConfigurationItem,
                async (
                    configurationItem:
                        | ConfigurationItem<string>
                        | ConfigurationItem<string[]>
                ) => {
                    const previousValue = configurationItem.getValue()
                    if (typeof previousValue === 'string') {
                        const value = await vscode.window.showInputBox({
                            prompt: 'Please enter the new value',
                            value: previousValue,
                        })
                        ;(
                            configurationItem as ConfigurationItem<string>
                        ).setValue(value)
                        // TODO deal with the cancellation
                    } else {
                        // allow the user to enter multiple values
                        let userWantsToContinue: boolean = true
                        const newValues: string[] = []
                        while (
                            (userWantsToContinue =
                                await UIPrompts.actionConfirmed(
                                    `Do you want to add another value?`
                                ))
                        ) {
                            const value = await vscode.window.showInputBox({
                                prompt: `Please enter the new ${
                                    newValues.length + 1
                                }. value`,
                            })
                            newValues.push(value)
                            // TODO deal with the cancellation
                        }
                        ;(
                            configurationItem as ConfigurationItem<string[]>
                        ).setValue(newValues)
                    }
                }
            )
        )
    }
}
