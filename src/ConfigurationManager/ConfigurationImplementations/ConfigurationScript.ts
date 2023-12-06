import * as vscode from 'vscode'
import {
    ConfigurationType,
    DiscoPoPRunCapableConfiguration,
    HotspotDetectionRunCapableConfiguration,
} from '../Configuration'
import { ConfigurationViewOnly } from './ConfigurationViewOnly'
import { StringProperty } from '../Property'
import { TreeItem } from 'vscode'
import { ConfigurationTreeItem } from '../ConfigurationTreeItem'
import { exec } from 'child_process'
import * as fs from 'fs'

export class ConfigurationScript
    extends ConfigurationViewOnly
    implements
        DiscoPoPRunCapableConfiguration,
        HotspotDetectionRunCapableConfiguration
{
    constructor(
        name: string,
        observer: any,
        dotDiscoPoP: string,
        discopopScriptPath: string,
        hotspotDetectionScriptPath: string
    ) {
        super(name, observer, dotDiscoPoP)
        this._discopopScriptPath = new StringProperty(
            'script path',
            discopopScriptPath,
            'Enter the path to a script that runs discopop',
            this
        )
        this._hotspotDetectionScriptPath = new StringProperty(
            'script path',
            hotspotDetectionScriptPath,
            'Enter the path to a script that runs hotspot detection',
            this
        )
    }

    private readonly _discopopScriptPath: StringProperty
    get discopopScriptPath(): string {
        return this._discopopScriptPath.value
    }
    set discopopScriptPath(value: string) {
        this._discopopScriptPath.value = value
        this.refresh()
    }

    private readonly _hotspotDetectionScriptPath: StringProperty
    get hotspotDetectionScriptPath(): string {
        return this._hotspotDetectionScriptPath.value
    }
    set hotspotDetectionScriptPath(value: string) {
        this._hotspotDetectionScriptPath.value = value
        this.refresh()
    }

    private _runScript(script: string, message: string): Promise<boolean> {
        // check if the script exists and is executable using the fs module
        try {
            fs.accessSync(
                this.discopopScriptPath,
                fs.constants.X_OK | fs.constants.F_OK
            )
        } catch (err) {
            throw new Error(
                `${this.discopopScriptPath} is not a valid script path. Please make sure the path is correct and the script is executable.`
            )
        }

        return new Promise<boolean>((resolve, reject) => {
            vscode.window
                .withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        title: message,
                        cancellable: true,
                    },
                    (progress, token) => {
                        return new Promise<boolean>((resolve, reject) => {
                            const childProcess = exec(
                                this.discopopScriptPath,
                                {
                                    cwd: this.discopopScriptPath.substring(
                                        0,
                                        this.discopopScriptPath.lastIndexOf('/')
                                    ),
                                },
                                (err, stdout, stderr) => {
                                    if (err) {
                                        reject(
                                            new Error(
                                                `${this.discopopScriptPath} failed: ${err.message}`
                                            )
                                        )
                                    } else {
                                        resolve(true)
                                    }
                                }
                            )
                            childProcess.stdout.on('data', (data) => {
                                progress.report({ message: data.toString() })
                            })
                            childProcess.stderr.on('data', (data) => {
                                progress.report({ message: data.toString() })
                            })
                            childProcess.on('close', () => {
                                resolve(false)
                            })
                            token.onCancellationRequested(() => {
                                const killSuccessful = childProcess.kill()
                                if (!killSuccessful) {
                                    reject(
                                        new Error(
                                            `tried to kill ${this.discopopScriptPath} but failed, please kill it manually`
                                        )
                                    )
                                } else {
                                    console.log
                                    resolve(false)
                                }
                            })
                        })
                    }
                )
                .then(
                    (success) => {
                        resolve(success)
                    },
                    (err) => {
                        reject(err)
                    }
                )
        })
    }

    async runDiscoPoP(): Promise<boolean> {
        return this._runScript(this.discopopScriptPath, 'Running DiscoPoP')
    }

    async runHotspotDetection(): Promise<boolean> {
        return this._runScript(
            this.hotspotDetectionScriptPath,
            'Running HotspotDetection'
        )
    }

    getView(): TreeItem {
        const treeItem = super.getView()
        treeItem.contextValue = 'configuration-runnable'
        return treeItem
    }

    getChildren(): ConfigurationTreeItem[] {
        return [
            ...super.getChildren(),
            this._discopopScriptPath,
            this._hotspotDetectionScriptPath,
        ]
    }

    toJSON(): any {
        return {
            ...super.toJSON(),
            configurationType: ConfigurationType.Script,
            discopopScriptPath: this.discopopScriptPath,
            hotspotDetectionScriptPath: this.hotspotDetectionScriptPath,
        }
    }
}
