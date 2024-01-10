import {
    SingleCommandToolOptions,
    SingleCommandToolRunner,
} from '../../SingleCommandToolRunner'

export class DiscoPoPPatchApplicatorOptions extends SingleCommandToolOptions {
    public constructor(protected _pwd: string) {
        super()
    }
    public get command(): string {
        return 'discopop_patch_applicator'
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

export class DiscoPoPPatchApplicatorRunner extends SingleCommandToolRunner<DiscoPoPPatchApplicatorOptions> {
    public constructor(_options: DiscoPoPPatchApplicatorOptions) {
        super(_options)
    }
}
