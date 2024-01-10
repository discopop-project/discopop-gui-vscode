import { ToolProgress } from '../../ToolProgress'

export class StdoutToolProgress implements ToolProgress {
    private accumulatedProgress: number = 0
    public constructor(private prefix: string) {}

    reportMessage(message: string) {
        console.log(`${this.prefix}[${this.paddedProgress}]: ${message}`)
    }
    reportProgress(percent: number) {
        this.accumulatedProgress = percent
        console.log(`${this.prefix}[${this.paddedProgress}]`)
    }
    reportMessageWithProgress(message, percent) {
        this.accumulatedProgress = percent
        console.log(`${this.prefix}[${this.paddedProgress}]: ${message}`)
    }
    reportError(error) {
        console.error(`${this.prefix}[${this.paddedProgress}]: ${error}`)
    }

    /** pads numbers to consume at least three characters by adding spaces on the left side */
    private get paddedProgress(): string {
        return this.accumulatedProgress.toString() //.padStart(3);
    }
}
