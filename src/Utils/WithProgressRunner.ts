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
        private operations: ProgressingOperation<State>[],
        private state: Partial<State>,
        private errorHandler: (error: unknown) => void = (error: unknown) =>
            console.error(error),
        private doneMessage: string | undefined = undefined,
        private keepItOpenSeconds: number = 0
    ) {}

    /**
     * Runs all operations in the order they were given.
     * Reports progress to the user.
     * @returns the final state
     */
    public async run() {
        await vscode.window.withProgress(
            {
                location: this.location,
                title: this.title,
                cancellable: this.cancellable,
            },
            async (progress, token) => {
                try {
                    for (const operation of this.operations) {
                        progress.report({
                            increment: this.nextIncrement,
                            message: operation.message,
                        })
                        await operation.operation(this.state)
                        this.nextIncrement = operation.increment
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
                    this.errorHandler(error)
                }
            }
        )
    }
}

export interface ProgressingOperation<State extends Object> {
    message: string
    increment: number
    operation: (state: Partial<State>) => Promise<void>
}


// TODO normalize the increment values so that they add up to 100

// TODO I think we can get rid of the state altogether
// the caller can do this himself
// we only have to ensure, that each step is finished before going to the next one