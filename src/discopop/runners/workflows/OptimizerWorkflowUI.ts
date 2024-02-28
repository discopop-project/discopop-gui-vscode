import * as vscode from 'vscode'
import { CancelToken } from '../../../utils/cancellation/CancelToken'
import { UICancelTokenWrapper } from '../../../utils/cancellation/UICancelTokenWrapper'
import { OptimizerWorkflow } from './OptimizerWorkflow'

export class OptimizerWorkflowUI {
    public constructor(public readonly dotDiscoPoP: string) {}

    public async run(overrideOptionsString?: string): Promise<void> {
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

                const optimizerRunner = new OptimizerWorkflow(this.dotDiscoPoP)

                return await optimizerRunner.run(
                    reportMessageWrapper,
                    reportProgressWrapper,
                    cancelToken,
                    overrideOptionsString ? overrideOptionsString : undefined // ternary operator to avoid passing empty string, instead pass undefined
                )
            }
        )
    }
}
