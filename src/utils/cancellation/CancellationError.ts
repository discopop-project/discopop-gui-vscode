export class CancellationError extends Error {
    constructor(message) {
        super(message)
        this.name = 'CancellationError'
    }
}
