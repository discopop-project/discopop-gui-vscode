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
        options: OptimizerOptions | string = DefaultOptimizerOptions,
        cancelToken?: CancelToken
    ): Promise<void> {
        await CommandExecution.commandExists(
            'discopop_optimizer',
            true,
            'Is DiscoPoP installed?'
        )

        // build the command string
        let command: string
        if (typeof options === 'string') {
            console.log('Using override options for optimizer') // TODO: remove (or add it to the other overrides as well)
            command = `discopop_optimizer ${options}`
        } else {
            // merge provided options with default options
            options = { ...DefaultOptimizerOptions, ...options }
            command = this._buildCommand(options)
        }

        await CommandExecution.execute({
            command: command,
            cwd: this.dotDiscoPoP,
            throwOnNonZeroExitCode: true,
            cancelToken: cancelToken,
            throwOnCancellation: true,
        })
    }
}
