import {
    SingleCommandToolOptions,
    SingleCommandToolRunner,
} from '../../SingleCommandToolRunner'

export class DiscoPoPOptimizerOptions extends SingleCommandToolOptions {
    public constructor(protected _pwd: string) {
        super()
    }
    public get command(): string {
        return 'discopop_optimizer'
    }
    public get argumentsString(): string {
        return '' // TODO
    }
    public get pwd(): string {
        return this._pwd
    }
    public get fullCommand(): string {
        return super.fullCommand
    }
}

export class DiscoPoPOptimizerRunner extends SingleCommandToolRunner<DiscoPoPOptimizerOptions> {
    public constructor(_options: DiscoPoPOptimizerOptions) {
        super(_options)
    }
}
