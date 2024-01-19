/** a simple one-time cancellation event system */
export interface CancelToken {
    /** adds a listener that will be called, when cancel() is called */
    onCancel(listener: () => void)

    /** removes a previously added listener so it will no longer be called upon cancellation */
    offCancel(listener: () => void)

    /** cancels this token, calling all listeners and setting cancellationRequested to true */
    cancel(): void

    /** whether this token has been cancelled */
    isCancelled: boolean
}
