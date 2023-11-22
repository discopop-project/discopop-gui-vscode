import * as vscode from 'vscode'
import { Commands } from '../Utils/Commands'
import { SimpleTree } from '../Utils/SimpleTree'
import { UIPrompts } from '../Utils/UIPrompts'
import { CMakeConfiguration } from './Configuration'
import { ConfigurationItem } from './ConfigurationItem'
import { Project } from './Project'
import { ProjectManagerTreeItem } from './ProjectManagerTreeItem'

export class ProjectManager extends SimpleTree<ProjectManagerTreeItem> {
    private projectViewer: vscode.TreeView<ProjectManagerTreeItem> | undefined
    private disposables: Map<Project, vscode.Disposable> = new Map()

    public constructor(
        private context: vscode.ExtensionContext,
        protected roots: Project[] = []
    ) {
        super(roots)
        this.roots.forEach((project) => {
            this.disposables.set(
                project,
                project.onDidChange(() => this.refresh())
            )
        })
        this._registerCommands() // TODO we dont wanna do it this way... the extension should register the commands (the extension has access to all the state, so it can work with it when executing commands)
        this.register()
        this._restoreProjectsFromState()
    }

    addProject(project: Project) {
        this.disposables.set(
            project,
            project.onDidChange(() => this.refresh())
        )
        this.roots.push(project)
        this.refresh()
    }

    removeProject(project: Project) {
        this.disposables.get(project)?.dispose()
        this.disposables.delete(project)
        this.roots = this.roots.filter((p) => p !== project)
        this.refresh()
    }

    public refresh(uiOnly: boolean = false): void {
        if (!uiOnly) {
            this._storeProjectsToState()
        }
        super.refresh()
    }

    public register() {
        this.projectViewer = vscode.window.createTreeView(
            'sidebar-projects-view',
            { treeDataProvider: this }
        )
        this.context.subscriptions.push(this.projectViewer)
    }

    public unregister() {
        this.projectViewer?.dispose()
        this.projectViewer = undefined
    }

    private _restoreProjectsFromState(): void {
        const storedProjects = this.context.workspaceState.get(
            'projects'
        ) as any[]
        if (storedProjects) {
            // clear old projects
            this.disposables.forEach((disposable) => disposable.dispose())
            this.disposables.clear()

            // add new projects
            this.roots = storedProjects.map((project) => {
                return Project.fromJSONObject(project)
            })
            this.roots.forEach((project) => {
                this.disposables.set(
                    project,
                    project.onDidChange(() => this.refresh())
                )
            })
            this.refresh(true)
        } else {
            // clear old projects
            this.disposables.forEach((disposable) => disposable.dispose())
            this.disposables.clear()
            this.roots = []
            this.refresh(true)
        }
    }

    private _storeProjectsToState(): void {
        const projects = this.roots?.map((project) => {
            return (project as Project).toJSONObject()
        })
        this.context.workspaceState.update('projects', projects)
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
                    const configuration = new CMakeConfiguration(
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
                async (configuration: CMakeConfiguration) => {
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
                async (configuration: CMakeConfiguration) => {
                    const value = await vscode.window.showInputBox({
                        prompt: 'Please enter the name of the new Configuration',
                        value: configuration.getName() + ' (copy)',
                    })
                    if (value) {
                        const newConfiguration = new CMakeConfiguration(
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
                async (configuration: CMakeConfiguration) => {
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
