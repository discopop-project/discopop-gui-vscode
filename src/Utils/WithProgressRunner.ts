import * as vscode from 'vscode'

// TODO do we need to do anything to allow cancellation?

/**
 * This class is a wrapper around the vscode API to report progress more intuitively.
 * The vscode API for progress reporting is somewhat weird, consider the following example:
 *
 *  - call progress.report with increment=10 and message="Doing X..."
 *  - doX()
 *  - call progress.report with increment=90 and message="Doing Y..."
 *  - doY()
 *
 * ==> The increments no longer refer to their messages. e.g. in the second call to progress.report:
 *     It correctly shows the "Doing Y..." message.
 *     However the 90% of progress seem to have been completed before the work is actually started.
 *
 * This class fixes this behavior. Operations consist of a message, an increment and an async function -- and they actually belong together.
 */
export class WithProgressRunner<State> {
    private nextIncrement: number = 0

    public constructor(
        private title: string,
        private location: vscode.ProgressLocation,
        private cancellable: boolean,
        private operations: WithProgressOperation[],
        private doneMessage: string | undefined = undefined,
        private keepItOpenSeconds: number = 0
    ) {}

    /**
     * Runs all operations in the order they were given.
     * Reports progress to the user.
     * @throws if any of the operations throws
     * @returns true if the user did not cancel the operation, false if the operation was cancelled
     */
    public async run(): Promise<boolean> {
        this._normalizeIncrements()
        let currentOperation: WithProgressOperation
        let cancellationRequested = false
        await vscode.window.withProgress(
            {
                location: this.location,
                title: this.title,
                cancellable: this.cancellable,
            },
            async (progress, token) => {
                const cancellationDisposable = token.onCancellationRequested(
                    () => {
                        cancellationRequested = true
                    }
                )
                try {
                    for (currentOperation of this.operations) {
                        progress.report({
                            increment: this.nextIncrement,
                            message: currentOperation.message,
                        })
                        await currentOperation.operation(token)
                        if (cancellationRequested) {
                            console.log(
                                'WithProgressRunner: cancellation requested::',
                                this.title,
                                '::',
                                currentOperation.message
                            )
                            break
                        }
                        this.nextIncrement = currentOperation.increment
                    }

                    progress.report({
                        increment: this.nextIncrement,
                        message: this.doneMessage,
                    })
                    if (this.keepItOpenSeconds) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, this.keepItOpenSeconds * 1000)
                        )
                    }
                } catch (error) {
                    throw error
                } finally {
                    await cancellationDisposable.dispose()
                }
            }
        )
        return !cancellationRequested
    }

    private _normalizeIncrements() {
        const sum = this.operations.reduce(
            (sum, operation) => sum + operation.increment,
            0
        )
        this.operations.forEach((operation) => {
            operation.increment = (operation.increment / sum) * 100
        })
    }
}

export interface WithProgressOperation {
    message: string
    increment: number
    operation: (token: vscode.CancellationToken) => Promise<void>
}

// TODO normalize the increment values so that they add up to 100
