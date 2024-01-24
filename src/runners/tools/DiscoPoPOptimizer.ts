import { CancelToken } from '../helpers/cancellation/CancelToken'
import { CommandExecution } from '../helpers/CommandExecution'

export enum OptimizerExecutionType {
    Exhaustive = 'exhaustive',
    Evolutionary = 'evolutionary',
    Greedy = 'greedy',
}

export interface OptimizerOptions {
    executionType?: OptimizerExecutionType
    verbose?: boolean
    doallMicrobenchFile?: string
    reductionMicrobenchFile?: string
    systemConfigurationFile?: string
}

export const DefaultOptimizerOptions: OptimizerOptions = {
    executionType: OptimizerExecutionType.Evolutionary,
    verbose: false,
    doallMicrobenchFile: undefined,
    reductionMicrobenchFile: undefined,
    systemConfigurationFile: undefined,
}

export class DiscoPoPOptimizer {
    public constructor(public readonly dotDiscoPoP: string) {}

    private _buildCommand(options: OptimizerOptions): string {
        let command = `discopop_optimizer`

        switch (options.executionType) {
            case OptimizerExecutionType.Evolutionary:
                break // default, does not need to be specified
            case OptimizerExecutionType.Exhaustive:
                command += ' --exhaustive'
                break
            case OptimizerExecutionType.Greedy:
                command += ' --greedy'
                break
            default:
                throw new Error(
                    `Unknown execution type: ${options.executionType}`
                )
        }

        if (options.verbose) {
            command += ' --verbose'
        }

        if (options.doallMicrobenchFile) {
            command += ` --doall-microbench-file ${options.doallMicrobenchFile}`
        }

        if (options.reductionMicrobenchFile) {
            command += ` --reduction-microbench-file ${options.reductionMicrobenchFile}`
        }

        if (options.systemConfigurationFile) {
            command += ` --system-configuration ${options.systemConfigurationFile}`
        }

        return command
    }

    public async run(
        options: OptimizerOptions = DefaultOptimizerOptions,
        cancelToken?: CancelToken
    ): Promise<void> {
        // merge provided options with default options
        options = { ...DefaultOptimizerOptions, ...options }

        const command = this._buildCommand(options)

        await CommandExecution.execute({
            command: command,
            cwd: this.dotDiscoPoP,
            throwOnNonZeroExitCode: true,
            cancelToken: cancelToken,
            throwOnCancellation: true,
        })
    }
}
