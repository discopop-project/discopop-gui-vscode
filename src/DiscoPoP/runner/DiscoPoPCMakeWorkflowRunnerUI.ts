import EventEmitter = require('events')
import { CancelToken } from '../../Utils/CancelToken'
import { DiscoPoPCMakeWorkflowRunner } from './DiscoPoPCMakeWorkflowRunner'
import * as vscode from 'vscode'
import { UIPrompts } from '../../Utils/UIPrompts'

export class DiscoPoPCMakeWorkflowRunnerUI {
    public constructor(
        public readonly projectDirectory: string,
        public readonly executableName: string,
        public readonly executableArguments: string = '',
        public readonly buildDirectory?: string,
        public readonly dotDiscoPoP?: string
    ) {
        if (!this.buildDirectory) {
            this.buildDirectory = projectDirectory + '/build/DiscoPoP'
        }

        if (!this.dotDiscoPoP) {
            this.dotDiscoPoP = projectDirectory + 'build/.discopop'
        }
    }

    public async run() {
        const dpRunnerCMake = new DiscoPoPCMakeWorkflowRunner(
            this.projectDirectory,
            this.executableName,
            this.executableArguments,
            this.buildDirectory,
            this.dotDiscoPoP
        )

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Running DiscoPoP',
                cancellable: true,
            },
            async (progress, token) => {
                const cancelTokenWrapper: CancelToken = {
                    emitter: new EventEmitter(),
                    cancellationRequested: false,
                }
                cancelTokenWrapper.emitter.on('cancel', () => {
                    cancelTokenWrapper.cancellationRequested = true
                })
                const cancellationDisposable = token.onCancellationRequested(
                    () => {
                        cancelTokenWrapper.emitter.emit('cancel')
                    }
                )

                const reportMessageWrapper = (
                    message: string,
                    nesting: number
                ) => {
                    // all progress reports are logged to the console
                    console.log(
                        `DiscoPoPRunner: ${'-'.repeat(nesting)} ${message}`
                    )

                    // only top-level progress reports are shown in the UI
                    if (nesting === 0) {
                        progress.report({
                            message: message,
                        })
                    }
                }

                const reportProgressWrapper = (progressValue: number) => {
                    progress.report({
                        increment: progressValue,
                    })
                }

                const requestConfirmationWrapper = async (message: string) => {
                    return UIPrompts.actionConfirmed(message)
                }

                try {
                    await dpRunnerCMake.run(
                        reportMessageWrapper,
                        reportProgressWrapper,
                        requestConfirmationWrapper,
                        cancelTokenWrapper
                    )
                } catch (e: any) {
                    vscode.window.showErrorMessage(e.message || e)
                } finally {
                    cancellationDisposable.dispose()
                }
            }
        )
    }
}
