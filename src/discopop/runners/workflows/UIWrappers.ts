import * as vscode from 'vscode'
import { UIPrompts } from '../../../utils/UIPrompts'
import { CancelToken } from '../../../utils/cancellation/CancelToken'
import EventEmitter = require('events')

export class SimpleCancelToken implements CancelToken {
    private _cancellationRequested = false
    private _emitter = new EventEmitter()

    public onCancel(listener: () => void) {
        this._emitter.on('cancel', listener)
    }

    public offCancel(listener: () => void) {
        this._emitter.off('cancel', listener)
    }

    public cancel() {
        this._cancellationRequested = true
        this._emitter.emit('cancel')
    }

    public get isCancelled() {
        return this._cancellationRequested
    }
}

export class UICancelTokenWrapper extends SimpleCancelToken {
    public constructor(private token: vscode.CancellationToken) {
        super()
        this.token.onCancellationRequested(() => {
            this.cancel()
        })
    }
}

export function getReportMessageWrapper(
    prefix: string,
    progress: vscode.Progress<{ message?: string; increment?: number }>
) {
    return (message: string, nesting: number) => {
        // all progress reports are logged to the console
        console.log(`${prefix}${'-'.repeat(nesting)} ${message}`)

        // only top-level progress reports are shown in the UI
        if (nesting === 0) {
            progress.report({
                message: message,
            })
        }
    }
}

export function getReportProgressWrapper(
    progress: vscode.Progress<{ message?: string; increment?: number }>
) {
    return (progressValue: number) => {
        progress.report({
            increment: progressValue,
        })
    }
}

export function getRequestConfirmationWrapper() {
    return async (message: string) => {
        return UIPrompts.actionConfirmed(message)
    }
}

export function getCancelTokenWrapper(token: vscode.CancellationToken) {
    return new UICancelTokenWrapper(token)
}
