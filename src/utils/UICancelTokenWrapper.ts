import * as vscode from 'vscode'
import { SimpleCancelToken } from '../runners/helpers/cancellation/SimpleCancelToken'

export class UICancelTokenWrapper extends SimpleCancelToken {
    public constructor(private token: vscode.CancellationToken) {
        super()
        this.token.onCancellationRequested(() => {
            this.cancel()
        })
    }
}
