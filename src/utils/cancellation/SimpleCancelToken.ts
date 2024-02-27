import EventEmitter = require('events')
import { CancelToken } from './CancelToken'

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
