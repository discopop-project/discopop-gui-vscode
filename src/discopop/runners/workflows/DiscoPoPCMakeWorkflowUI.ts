import * as vscode from 'vscode'
import { UIPrompts } from '../../../utils/UIPrompts'
import { CancelToken } from '../../../utils/cancellation/CancelToken'
import { UICancelTokenWrapper as UICancelToken } from '../../../utils/cancellation/UICancelTokenWrapper'
import { DiscoPoPCMakeWorkflow } from './DiscoPoPCMakeWorkflow'

export class DiscoPoPCMakeWorkflowUI {
    public constructor(
        public readonly projectDirectory: string,
        public readonly executableName: string,
        public readonly executableArguments: string = '',
        public readonly buildDirectory?: string,
        public readonly dotDiscoPoP?: string,
        public readonly buildArguments?: string,
        public readonly overrideExplorerArguments?: string,
        public readonly overrideOptimizerArguments?: string
    ) {
        if (!this.buildDirectory) {
            this.buildDirectory = projectDirectory + '/build/DiscoPoP'
        }

        if (!this.dotDiscoPoP) {
            this.dotDiscoPoP = projectDirectory + 'build/.discopop'
        }
    }

    public async run(): Promise<void> {
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
                    console.log(`DiscoPoP: ${'-'.repeat(nesting)} ${message}`)

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

                const cancelToken: CancelToken = new UICancelToken(token)

                const dpRunnerCMake = new DiscoPoPCMakeWorkflow(
                    this.projectDirectory,
                    this.executableName,
                    this.executableArguments,
                    this.dotDiscoPoP,
                    this.buildDirectory,
                    this.buildArguments,
                    this.overrideExplorerArguments,
                    this.overrideOptimizerArguments
                )

                return await dpRunnerCMake.run(
                    reportMessageWrapper,
                    reportProgressWrapper,
                    requestConfirmationWrapper,
                    cancelToken
                )
            }
        )
    }
}
