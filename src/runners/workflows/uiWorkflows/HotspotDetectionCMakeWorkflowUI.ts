import * as vscode from 'vscode'
import { HotspotDetectionResults } from '../../../discopop/model/HotspotDetectionResults'
import { UIPrompts } from '../../../utils/UIPrompts'
import { CancelToken } from '../../../utils/cancellation/CancelToken'
import { UICancelTokenWrapper as UICancelToken } from '../../../utils/cancellation/UICancelTokenWrapper'
import { HotspotDetectionCMakeWorkflow } from '../pureWorkflows/HotspotDetectionCMakeWorkflow'

export class HotspotDetectionCMakeWorkflowUI {
    public constructor(
        public readonly projectDirectory: string,
        public readonly executableName: string,
        public readonly executableArguments: string[],
        public readonly dotDiscoPoP: string = projectDirectory +
            'build/.discopop',
        public readonly buildDirectory: string = projectDirectory +
            '/build/HotspotDetection',
        public readonly buildArguments: string = '',
        public readonly overridHotspotDetectionArguments?: string
    ) {}

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
                    this.buildDirectory,
                    this.buildArguments,
                    this.overridHotspotDetectionArguments
                )

                return await hsRunner.run(
                    reportMessageWrapper,
                    reportProgressWrapper,
                    requestConfirmationWrapper,
                    cancelToken
                )
            }
        )
    }
}
