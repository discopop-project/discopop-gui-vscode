import { CommandExecution } from '../helpers/CommandExecution'

export class DiscoPoPConfigProvider {
    public constructor() {}

    // TODO support this in discopop_config_provider
    // public get version(): Promise<string> {
    //     return CommandExecution.execute({
    //         command: "discopop_config_provider --version",
    //         throwOnNonZeroExitCode: true,
    //     }).then((result) => {
    //         return result.stdout;
    //     })
    // }

    public get buildDirectory(): Promise<string> {
        return CommandExecution.execute({
            command: 'discopop_config_provider --dp-build-dir',
            throwOnNonZeroExitCode: true,
        }).then((result) => {
            return result.stdout
        })
    }

    public get sourceDirectory(): Promise<string> {
        return CommandExecution.execute({
            command: 'discopop_config_provider --dp-source-dir',
            throwOnNonZeroExitCode: true,
        }).then((result) => {
            return result.stdout
        })
    }

    public get llvmBinDirectory(): Promise<string> {
        return CommandExecution.execute({
            command: 'discopop_config_provider --llvm-bin-dir',
            throwOnNonZeroExitCode: true,
        }).then((result) => {
            return result.stdout
        })
    }
}
