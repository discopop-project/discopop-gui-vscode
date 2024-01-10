import { ToolProgress } from '../../ToolProgress'

export class VSCodeToolProgress implements ToolProgress {
    constructor() {}
    public reportMessage(message: string): void {
        console.log('TODO: implement reportMessage')
    }
    public reportProgress(progress: number): void {
        console.log('TODO: implement reportProgress')
    }
    public reportMessageWithProgress(message: string, progress: number): void {
        console.log('TODO: implement reportMessageWithProgress')
    }
    public reportError(error: string): void {
        console.log('TODO: implement reportError')
    }
}
