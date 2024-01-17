import EventEmitter = require('events')
import { CancelToken } from '../../Utils/CancelToken'
import { DiscoPoPCMakeWorkflowRunner } from './DiscoPoPCMakeWorkflowRunner'
import * as vscode from 'vscode'
import { UIPrompts } from '../../Utils/UIPrompts'
import { DiscoPoPResults } from '../classes/DiscoPoPResults'
import { CancellationError } from '../../Utils/CancellationError'

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

    public async run(): Promise<DiscoPoPResults> {
        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Running DiscoPoP',
                cancellable: true,
            },
            async (progress, token) => {
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

                const cancelTokenWrapper: CancelToken = {
                    emitter: new EventEmitter(),
                    cancellationRequested: false,
                }
                token.onCancellationRequested(() => {
                    reportMessageWrapper('cancellation requested', 1)
                    cancelTokenWrapper.cancellationRequested = true
                    cancelTokenWrapper.emitter.emit('cancel')
                })

                try {
                    const dpRunnerCMake = new DiscoPoPCMakeWorkflowRunner(
                        this.projectDirectory,
                        this.executableName,
                        this.executableArguments,
                        this.buildDirectory,
                        this.dotDiscoPoP
                    )

                    const results = await dpRunnerCMake.run(
                        // await because we want to catch errors
                        reportMessageWrapper,
                        reportProgressWrapper,
                        requestConfirmationWrapper,
                        cancelTokenWrapper
                    )
                    return results
                } catch (e: any) {
                    if (e instanceof CancellationError) {
                        UIPrompts.showMessageForSeconds(
                            'DiscoPoP was cancelled',
                            5
                        )
                    } else {
                        vscode.window.showErrorMessage(e.message || e)
                    }
                }
            }
        )
    }
}
