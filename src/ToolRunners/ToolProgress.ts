export interface ToolProgress {
    reportMessage(message: string): void
    reportProgress(progress: number): void
    reportMessageWithProgress(message: string, progress: number): void
    reportError(error: string): void
}
