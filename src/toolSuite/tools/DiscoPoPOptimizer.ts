import { CancelToken } from '../../utils/cancellation/CancelToken'
import { CommandExecution } from '../../utils/CommandExecution'

export enum OptimizationLevel {
    None = 0,
    Greedy = 1,
    Evolutionary = 2,
    Exhaustive = 3,
}

/** Program path pruning aggressiveness */
export enum PathPruningAggressiveness {
    /** no pruning */
    None = 0,
    /** prune to paths that cover 80% of observed decisions per path split */
    One = 1,
    /** prune to most likely path */
    Two = 2,
}

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL',
}

export interface OptimizerOptions {
    // -h not modeled
    verbose?: boolean
    pathPruningAggressiveness?: PathPruningAggressiveness
    optimizationLevel?: OptimizationLevel
    opt2Params?: string // TODO model them more explicitly
    singleSuggestions?: boolean
    doallMicrobenchFile?: string
    reductionMicrobenchFile?: string
    systemConfigurationFile?: string
    enableProfiling?: boolean
    pinFunctionCallsToHost?: boolean
    logLevel?: LogLevel
    writeLog?: boolean

    interactiveExport?: number[]
}

export const DefaultOptimizerOptions: OptimizerOptions = {
    verbose: false,
    pathPruningAggressiveness: undefined,
    optimizationLevel: undefined,
    opt2Params: undefined,
    singleSuggestions: undefined,
    doallMicrobenchFile: undefined,
    reductionMicrobenchFile: undefined,
    systemConfigurationFile: undefined,
    enableProfiling: undefined,
    pinFunctionCallsToHost: undefined,
    logLevel: undefined,
    writeLog: undefined,

    interactiveExport: undefined,
}

export class DiscoPoPOptimizer {
    public constructor() {}

    private _buildCommand(options: OptimizerOptions): string {
        let command = `discopop_optimizer`

        if (options.verbose) {
            command += ' --verbose'
        }

        if (options.pathPruningAggressiveness) {
            command += ` -p ${options.pathPruningAggressiveness}`
        }

        if (options.optimizationLevel) {
            command += ` -o ${options.optimizationLevel}`
        }

        if (options.opt2Params) {
            command += ` -opt-2-params ${options.opt2Params}`
        }

        if (options.singleSuggestions) {
            command += ' --single-suggestions'
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

        if (options.enableProfiling) {
            command += ' --profiling'
        }

        if (options.pinFunctionCallsToHost) {
            command += ' --pin-function-calls-to-host'
        }

        if (options.logLevel) {
            command += ` --log ${options.logLevel}`
        }

        if (options.writeLog) {
            command += ' --write-log'
        }

        if (options.interactiveExport) {
            command += ` -i --interactive-export ${options.interactiveExport.join(
                ','
            )}`
        }

        return command
    }

    public async run(
        dotDiscopop: string,
        options: OptimizerOptions | string = DefaultOptimizerOptions,
        cancelToken?: CancelToken,
        stdoutCallback?: (data: string) => void,
        stderrCallback?: (data: string) => void
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
            cwd: dotDiscopop,
            throwOnNonZeroExitCode: true,
            cancelToken: cancelToken,
            throwOnCancellation: true,
            stdoutCallback: stdoutCallback,
            stderrCallback: stderrCallback,
        })
    }
}
