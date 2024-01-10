import {
    SingleCommandToolOptions,
    SingleCommandToolRunner,
} from '../../SingleCommandToolRunner'

export class DiscoPoPPatchGeneratorOptions extends SingleCommandToolOptions {
    public constructor(protected _pwd: string) {
        super()
    }
    public get command(): string {
        return 'discopop_patch_generator'
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

export class DiscoPoPPatchGeneratorRunner extends SingleCommandToolRunner<DiscoPoPPatchGeneratorOptions> {
    public constructor(_options: DiscoPoPPatchGeneratorOptions) {
        super(_options)
    }
}
