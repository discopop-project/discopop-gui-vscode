import { exec, execSync } from 'child_process'

export enum OptimizerExecutionType {
    Exhaustive = 'exhaustive',
    Evolutionary = 'evolutionary',
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

export abstract class OptimizerRunner {
    private constructor() {
        throw new Error('This class cannot be instantiated')
    }

    private static buildCommand(options: OptimizerOptions): string {
        let command = `discopop_optimizer`

        switch (options.executionType) {
            case OptimizerExecutionType.Evolutionary:
                break // default, does not need to be specified
            case OptimizerExecutionType.Exhaustive:
                command += ' --exhaustive'
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

    public static async run(
        dotDiscoPoP: string,
        {
            executionType = OptimizerExecutionType.Exhaustive,
            verbose = false,
            doallMicrobenchFile = undefined,
            reductionMicrobenchFile = undefined,
            systemConfigurationFile = undefined,
        }: OptimizerOptions = {
            executionType: OptimizerExecutionType.Exhaustive,
            verbose: false,
            doallMicrobenchFile: undefined,
            reductionMicrobenchFile: undefined,
            systemConfigurationFile: undefined,
        }
    ): Promise<void> {
        // might throw
        const command = OptimizerRunner.buildCommand({
            executionType,
            verbose,
            doallMicrobenchFile,
            reductionMicrobenchFile,
            systemConfigurationFile,
        })
        const stdout = execSync(command, {
            cwd: dotDiscoPoP,
            env: {
                ...process.env,
                DOT_DISCOPOP: dotDiscoPoP,
            },
            encoding: 'utf-8',
        })

        console.log('optimizer finished:')
        console.log(stdout)

        return
    }
}
