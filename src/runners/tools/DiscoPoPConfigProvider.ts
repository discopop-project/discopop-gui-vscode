import { CommandExecution } from '../helpers/CommandExecution'

export class DiscoPoPConfigProvider {
    public constructor() {}

    // TODO allow to get the version of DiscoPoP

    public get buildDirectory(): Promise<string> {
        return CommandExecution.commandExists(
            'discopop_config_provider',
            true,
            'Is DiscoPoP installed?'
        ).then((exists) => {
            return CommandExecution.execute({
                command: 'discopop_config_provider --dp-build-dir',
                throwOnNonZeroExitCode: true,
            }).then((result) => {
                return result.stdout
            })
        })
    }

    public get sourceDirectory(): Promise<string> {
        return CommandExecution.commandExists(
            'discopop_config_provider',
            true,
            'Is DiscoPoP installed?'
        ).then((exists) => {
            return CommandExecution.execute({
                command: 'discopop_config_provider --dp-source-dir',
                throwOnNonZeroExitCode: true,
            }).then((result) => {
                return result.stdout
            })
        })
    }

    public get llvmBinDirectory(): Promise<string> {
        return CommandExecution.commandExists(
            'discopop_config_provider',
            true,
            'Is DiscoPoP installed?'
        ).then((exists) => {
            return CommandExecution.execute({
                command: 'discopop_config_provider --llvm-bin-dir',
                throwOnNonZeroExitCode: true,
            }).then((result) => {
                return result.stdout
            })
        })
    }
}
