import {
    SingleCommandToolRunner,
    SingleCommandToolOptions,
} from './SingleCommandToolRunner'
import { ToolRunner } from './ToolRunner'
import { ToolProgress } from './ToolProgress'

export class PipelinedToolRunner implements ToolRunner {
    public constructor(
        protected steps: ToolRunner[],
        protected InnerProgress: new () => ToolProgress,
        protected progressValues?: number[],
        protected continueOnError: boolean = false,
        protected prefix: string = ''
    ) {
        if (progressValues === undefined) {
            this.progressValues = new Array(steps.length).fill(
                (1 / steps.length) * 100
            )
        } else if (steps.length !== progressValues.length) {
            throw new Error(
                `DEVELOPER ERROR: length of steps (${steps.length}) does not match length of progressValues (${progressValues.length})`
            )
        }
    }

    public async run(progress: ToolProgress): Promise<void> {
        let accumulatedProgress = 0
        for (const runner of this.steps) {
            const idx = this.steps.indexOf(runner)

            progress.reportMessage(
                `${this.prefix} [${idx + 1}/${this.steps.length}]: ${
                    runner.description
                }`
            )
            try {
                await runner.run(new this.InnerProgress())
                accumulatedProgress += this.progressValues[idx]
            } catch (error) {
                progress.reportError(
                    `${this.prefix} [${idx + 1}/${this.steps.length}]: ${
                        runner.description
                    } failed with error: ${error}`
                )
                if (this.continueOnError) {
                    continue
                } else {
                    throw error
                }
            }
            progress.reportMessageWithProgress(
                `${this.prefix} [${idx + 1}/${this.steps.length}]: ${
                    runner.description
                } completed`,
                accumulatedProgress
            )
        }
    }

    public get description(): string {
        return this.steps.map((step) => step.description).join(' | ')
    }
}
