import { EventEmitter } from 'events'

export type CancelToken = {
    emitter: EventEmitter // emits "cancel" event when cancellation is requested
    cancellationRequested: boolean
}
