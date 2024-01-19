import * as vscode from 'vscode'
import { UIPrompts } from '../../Utils/UIPrompts'
import { CancelToken } from '../helpers/cancellation/CancelToken'
import { UICancelTokenWrapper as UICancelToken } from '../helpers/cancellation/UICancelTokenWrapper'
import { HotspotDetectionResults } from '../../HotspotDetection/classes/HotspotDetectionResults'
import { HotspotDetectionCMakeWorkflow } from './HotspotDetectionCMakeWorkflow'

export class HotspotDetectionCMakeWorkflowUI {
    public constructor(
        public readonly projectDirectory: string,
        public readonly executableName: string,
        public readonly executableArguments: string[],
        public readonly buildDirectory?: string,
        public readonly dotDiscoPoP?: string
    ) {
        if (!this.buildDirectory) {
            this.buildDirectory = projectDirectory + '/build/HotspotDetection'
        }

        if (!this.dotDiscoPoP) {
            this.dotDiscoPoP = projectDirectory + 'build/.discopop'
        }
    }

    public async run(): Promise<HotspotDetectionResults> {
        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Running HotspotDetection',
                cancellable: true,
            },
            async (progress, token) => {
                const reportMessageWrapper = (
                    message: string,
                    nesting: number
                ) => {
                    // all progress reports are logged to the console
                    console.log(
                        `HotspotDetection: ${'-'.repeat(nesting)} ${message}`
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

                const cancelToken: CancelToken = new UICancelToken(token)

                const hsRunner = new HotspotDetectionCMakeWorkflow(
                    this.projectDirectory,
                    this.executableName,
                    this.executableArguments,
                    this.dotDiscoPoP,
                    this.buildDirectory
                )

                // await because we want to catch errors
                const results = await hsRunner.run(
                    reportMessageWrapper,
                    reportProgressWrapper,
                    requestConfirmationWrapper,
                    cancelToken
                )
                return results
            }
        )
    }
}
