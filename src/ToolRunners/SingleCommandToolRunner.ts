import { ToolRunner } from './ToolRunner'
import { ToolProgress } from './ToolProgress'

export abstract class SingleCommandToolOptions {
    protected constructor() {}
    public abstract get command(): string
    public abstract get argumentsString(): string
    public abstract get pwd(): string
    public get fullCommand(): string {
        return `${this.command} ${this.argumentsString}`
    }
}

export abstract class SingleCommandToolRunner<
    T extends SingleCommandToolOptions
> implements ToolRunner
{
    protected constructor(public options: T) {}

    public async run(progress: ToolProgress): Promise<void> {
        const command = this.options.command
        const args = this.options.argumentsString
        const pwd = this.options.pwd
        // TODO env
        console.log(
            `TODO: implement SingleCommandToolRunner:run\n\t --> "running ${command} with args: ${args} in ${pwd}"`
        ) // TODO env
    }

    public get description(): string {
        return this.options.command
    }
}
