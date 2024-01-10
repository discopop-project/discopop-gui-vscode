import {
    SingleCommandToolOptions,
    SingleCommandToolRunner,
} from '../../SingleCommandToolRunner'

export class DiscoPoPExplorerOptions extends SingleCommandToolOptions {
    public constructor(protected _pwd: string) {
        super()
    }
    public get command(): string {
        return 'discopop_explorer'
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

export class DiscoPoPExplorerRunner extends SingleCommandToolRunner<DiscoPoPExplorerOptions> {
    public constructor(_options: DiscoPoPExplorerOptions) {
        super(_options)
    }
}
