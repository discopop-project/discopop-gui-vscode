import * as vscode from 'vscode'
import { DiscoPoPResults } from '../../discoPoP/classes/DiscoPoPResults'
import { CancelToken } from '../helpers/cancellation/CancelToken'
import { UICancelTokenWrapper } from '../helpers/cancellation/UICancelTokenWrapper'
import { OptimizerWorkflow } from './OptimizerWorkflow'

export class OptimizerWorkflowUI {
    public constructor(public readonly dotDiscoPoP: string) {}

    public async run(): Promise<DiscoPoPResults> {
        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Running Optimizer',
                cancellable: true,
            },
            async (progress, token) => {
                const reportMessageWrapper = (
                    message: string,
                    nesting: number
                ) => {
                    // all progress reports are logged to the console
                    console.log(`Optimizer: ${'-'.repeat(nesting)} ${message}`)

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

                const cancelToken: CancelToken = new UICancelTokenWrapper(token)

                const dpRunnerCMake = new OptimizerWorkflow(this.dotDiscoPoP)

                return await dpRunnerCMake.run(
                    reportMessageWrapper,
                    reportProgressWrapper,
                    cancelToken
                )
            }
        )
    }
}
