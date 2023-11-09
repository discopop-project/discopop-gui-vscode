import * as vscode from 'vscode'
import * as fs from 'fs'
import { exec } from 'child_process'

import { Config } from '../Utils/Config'
import { DefaultConfiguration } from '../ProjectManager/Configuration'
import { UIPrompts } from '../Utils/UIPrompts'
import { FileMappingParser } from '../FileMapping/FileMappingParser'
import { DiscoPoPParser } from './DiscoPoPParser'
import { FileMapping } from '../FileMapping/FileMapping'
import {
    WithProgressOperation,
    WithProgressRunner,
} from '../Utils/WithProgressRunner'
import { getDefaultErrorHandler } from '../Utils/ErrorHandler'
import { LineMapping } from '../LineMapping/LineMapping'
import { Suggestion } from './classes/Suggestion/Suggestion'

export interface DiscoPoPRunnerRunArguments {
    fullConfiguration: DefaultConfiguration // TODO replace with only the necessary fields
}

export interface DiscoPoPRunnerParseArguments {
    fullConfiguration: DefaultConfiguration // TODO replace with only the necessary fields
}

export class DiscoPoPResults {
    public constructor(
        public dotDiscoPoP: string,
        public suggestionsByType: Map<string, Suggestion[]>,
        public fileMapping: FileMapping,
        public lineMapping: LineMapping
    ) {}

    public getSuggestionById(id: number): Suggestion | undefined {
        for (const suggestions of this.suggestionsByType.values()) {
            for (const suggestion of suggestions) {
                if (suggestion.id === id) {
                    return suggestion
                }
            }
        }
        return undefined
    }

    // TODO getSuggestionsForFileId(fileId: number): Suggestion[] { ... }
    // TODO getSuggestionsForFile(file: string): Suggestion[] { ... }
    // TODO getSuggestionsForType(type: string): Suggestion[] { ... }
}

export abstract class DiscoPoPRunner {
    private constructor() {
        throw new Error('This class cannot be instantiated.')
    }

    public static async runAndParse(
        dpRunnerArgs: DiscoPoPRunnerRunArguments & DiscoPoPRunnerParseArguments
    ): Promise<DiscoPoPResults> {
        await DiscoPoPRunner.run(dpRunnerArgs)
        return DiscoPoPRunner.parse(dpRunnerArgs)
    }

    public static async run(
        dpRunnerRunArgs: DiscoPoPRunnerRunArguments
    ): Promise<void> {
        const steps: WithProgressOperation[] = []

        steps.push({
            message: 'Checking setup...',
            increment: 0,
            operation: async () => {
                Config.checkDiscoPoPSetup()
            },
        })

        steps.push({
            message: 'Preparing build directory...',
            increment: 5,
            operation: async () => {
                await this._createBuildDirectory(
                    dpRunnerRunArgs.fullConfiguration
                )
            },
        })

        steps.push({
            message: 'Running CMAKE...',
            increment: 10,
            operation: async () => {
                await this._runCMake(dpRunnerRunArgs.fullConfiguration)
            },
        })

        steps.push({
            message: 'Running MAKE...',
            increment: 10,
            operation: async () => {
                await this._runMake(dpRunnerRunArgs.fullConfiguration)
            },
        })

        steps.push({
            message: 'Running executable...',
            increment: 20,
            operation: async () => {
                await this._runExecutable(dpRunnerRunArgs.fullConfiguration)
            },
        })

        steps.push({
            message: 'Running discopop_explorer...',
            increment: 45,
            operation: async () => {
                await this._runDiscopopExplorer(
                    dpRunnerRunArgs.fullConfiguration
                )
            },
        })

        steps.push({
            message: 'Generating patches...',
            increment: 10,
            operation: async () => {
                await this._generatePatches(dpRunnerRunArgs.fullConfiguration)
            },
        })

        const withProgressRunner = new WithProgressRunner(
            'Running DiscoPoP',
            vscode.ProgressLocation.Notification,
            false, // TODO: true is currently NOT supported
            steps,
            getDefaultErrorHandler('DiscoPoP failed. ')
        )

        return withProgressRunner.run()
    }

    public static async parse(
        dpRunnerParseArgs: DiscoPoPRunnerParseArguments
    ): Promise<DiscoPoPResults> {
        const steps: WithProgressOperation[] = []

        let fileMapping: FileMapping | undefined = undefined
        steps.push({
            message: 'Parsing FileMapping...',
            increment: 3,
            operation: async () => {
                fileMapping = FileMappingParser.parseFile(
                    `${dpRunnerParseArgs.fullConfiguration.getDiscoPoPBuildDirectory()}/.discopop/FileMapping.txt`
                )
            },
        })

        let suggestionsByType: Map<string, Suggestion[]> | undefined = undefined
        steps.push({
            message: 'Parsing suggestions...',
            increment: 3,
            operation: async () => {
                suggestionsByType = DiscoPoPParser.parseFile(
                    `${dpRunnerParseArgs.fullConfiguration.getDiscoPoPBuildDirectory()}/.discopop/explorer/patterns.json`
                )
            },
        })

        let lineMapping: LineMapping | undefined = undefined
        steps.push({
            message: 'Synchronizing LineMapping...',
            increment: 1,
            operation: async () => {
                const lineMappingFile = `${dpRunnerParseArgs.fullConfiguration.getDiscoPoPBuildDirectory()}/.discopop/line_mapping.json`
                lineMapping = new LineMapping(lineMappingFile)
            },
        })

        const withProgressRunner = new WithProgressRunner(
            'Parsing DiscoPoP results',
            vscode.ProgressLocation.Notification,
            false, // TODO: true is currently NOT supported
            steps,
            getDefaultErrorHandler('DiscoPoP parsing failed. ')
        )

        await withProgressRunner.run()

        return new DiscoPoPResults(
            dpRunnerParseArgs.fullConfiguration.getDiscoPoPBuildDirectory() +
                '/.discopop',
            suggestionsByType!,
            fileMapping!,
            lineMapping!
        )
    }

    /**
     * Creates the build directory if it does not exist yet.
     */
    private static async _createBuildDirectory(
        configuration: DefaultConfiguration
    ): Promise<void> {
        if (!fs.existsSync(configuration.getDiscoPoPBuildDirectory())) {
            fs.mkdirSync(configuration.getDiscoPoPBuildDirectory(), {
                recursive: true,
            })
        } else if (
            Config.skipOverwriteConfirmation() ||
            (await UIPrompts.actionConfirmed(
                'The build directory already exists. Do you want to overwrite it?\n(You can disable this dialog in the extension settings)'
            ))
        ) {
            fs.rmSync(configuration.getDiscoPoPBuildDirectory(), {
                recursive: true,
            })
            fs.mkdirSync(configuration.getDiscoPoPBuildDirectory(), {
                recursive: true,
            })
        } else {
            throw new Error('Operation cancelled by user')
        }
    }

    /**
     * Runs the cmake wrapper script.
     */
    private static async _runCMake(
        configuration: DefaultConfiguration
    ): Promise<void> {
        const cmakeWrapperScript = `${Config.discopopBuild()}/scripts/CMAKE_wrapper.sh`
        return new Promise<void>((resolve, reject) => {
            exec(
                `${cmakeWrapperScript} ${configuration.getProjectPath()}`,
                { cwd: configuration.getDiscoPoPBuildDirectory() },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                'CMAKE failed: ' + err.message + '\n' + stderr
                            )
                        )
                    } else {
                        resolve()
                    }
                }
            )
        })
    }

    /**
     * Runs make to build the project.
     */
    private static async _runMake(
        configuration: DefaultConfiguration
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            exec(
                `make > make.log 2>&1`,
                { cwd: configuration.getDiscoPoPBuildDirectory() },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                'MAKE failed: ' + err.message + '\n' + stderr
                            )
                        )
                    } else {
                        resolve()
                    }
                }
            )
        })

        // // NOTE: we might want to remember this approach on how to automatically detect the executable name:
        // // parse the make log and look for "Linking CXX executable"
        // let autoDetectedExecutableName: string | undefined
        // const makeLog = fs.readFileSync(`${fullConfiguration.getBuildDirectory()}/make.log`, 'utf-8')
        // const regex = /Linking CXX executable ([a-zA-Z0-9_]+)/
        // const match = makeLog.match(regex)
        // if (match) {
        //    vscode.window.showInformationMessage("Executable name detected: " + match[1])
        //    autoDetectedExecutableName = match[1]
        // }
        // else {
        //    vscode.window.showErrorMessage("Could not automatically detect executable name.")
        // }
    }

    /**
     * Runs the executable.
     */
    private static async _runExecutable(
        configuration: DefaultConfiguration
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            exec(
                `${configuration.getDiscoPoPBuildDirectory()}/${configuration.getExecutableName()} ${
                    configuration.getExecutableArgumentsDiscoPoP()
                        ? configuration.getExecutableArgumentsDiscoPoP()
                        : ''
                }`,
                { cwd: configuration.getDiscoPoPBuildDirectory() },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                'Executable failed: ' +
                                    err.message +
                                    '\n' +
                                    stderr
                            )
                        )
                        // TODO maybe it is acceptable for the executable to fail?
                    } else {
                        resolve()
                    }
                }
            )
        })
    }

    /**
     * Runs discopop_explorer.
     */
    private static async _runDiscopopExplorer(
        configuration: DefaultConfiguration
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            exec(
                `discopop_explorer`,
                {
                    cwd: `${configuration.getDiscoPoPBuildDirectory()}/.discopop`,
                },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                'discopop_explorer failed: ' +
                                    err.message +
                                    '\n' +
                                    stderr
                            )
                        )
                    }
                    // TODO errors are not reliably reported? --> fix in discopop_explorer!
                    // for now: ensure that patterns.json was created
                    else if (
                        !fs.existsSync(
                            `${configuration.getDiscoPoPBuildDirectory()}/.discopop/explorer/patterns.json`
                        )
                    ) {
                        reject(
                            new Error(
                                'discopop_explorer failed: patterns.json was not created'
                            )
                        )
                    } else {
                        resolve()
                    }
                }
            )
        })
    }

    /**
     * Generates patches.
     */
    private static async _generatePatches(
        configuration: DefaultConfiguration
    ): Promise<void> {
        // run like patch_generator like discopop_explorer
        return new Promise<void>((resolve, reject) => {
            exec(
                `discopop_patch_generator --dp-build-path=${Config.discopopBuild()}`,
                {
                    cwd: `${configuration.getDiscoPoPBuildDirectory()}/.discopop`,
                },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                'discopop_patch_generator failed: ' +
                                    err.message +
                                    '\n' +
                                    stderr
                            )
                        )
                    } else {
                        resolve()
                    }
                }
            )
        })
    }
}
