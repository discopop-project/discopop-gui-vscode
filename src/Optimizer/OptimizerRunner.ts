import { execSync } from 'child_process'

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
        options: OptimizerOptions = DefaultOptimizerOptions
    ): Promise<void> {
        // merge provided options with default options
        options = { ...DefaultOptimizerOptions, ...options }

        const command = this.buildCommand(options)

        console.log('running optimizer with command:')
        console.log(command)

        // might throw
        const optimizerStdout = execSync(command, {
            cwd: dotDiscoPoP,
            env: {
                ...process.env,
                DOT_DISCOPOP: dotDiscoPoP,
            },
            encoding: 'utf-8',
        })

        console.log('optimizer finished, output:')
        console.log(optimizerStdout)

        console.log('updating patches')
        // might throw
        const PatchGeneratorStdout = execSync(
            `discopop_patch_generator -a ${dotDiscoPoP}/optimizer/patterns.json`,
            {
                cwd: dotDiscoPoP,
                encoding: 'utf-8',
            }
        )

        console.log('patch generator finished:')
        console.log(PatchGeneratorStdout)
        return
    }
}
