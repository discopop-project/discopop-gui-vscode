import * as fs from 'fs'
import { CommandExecution } from '../../../../utils/CommandExecution'
import { CancelToken } from '../../../../utils/cancellation/CancelToken'
import { CancellationError } from '../../../../utils/cancellation/CancellationError'

export interface WrapperInfo {
    readonly cmakeWrapper: Promise<string>
}

// export interface CMakeProjectInfo {
//     readonly srcDirectory: string
//     readonly buildDirectory: string
//     readonly executableName: string
//     /** the executable will be run once for each entry in the array, providing the entry as command line arguments */
//     readonly executableArguments: string[]
//     readonly buildArguments?: string
// }

// cmake has some compiler tests that mess up our results
// implemented workaround:
//  --> run cmake without providing a path to .discopop --> will create a local .discopop directory
//  --> then delete the local .discopop directory as it only contains invalid information
// this fix requires however that the provided .discopop directory is not the same as the local .discopop directory
// (otherwise we might delete information that we still need, e.g. results from other instrumentation passes)

export abstract class CMakeBasedInstrumentation {
    public constructor(public readonly dotDiscopop: string) {}

    public abstract get wrapperInfo(): WrapperInfo

    public prepareBuildDirectory(buildDirectory: string): void {
        if (this.dotDiscopop === buildDirectory + '/.discopop') {
            throw new Error(
                'Currently we do not support .discopop inside the build directory. Please provide a different location for .discopop.'
            )
        }
        fs.rmSync(buildDirectory, {
            recursive: true,
            force: true,
        })
        fs.mkdirSync(buildDirectory, { recursive: true })
    }

    public async runCmake(
        buildArguments: string,
        srcDirectory: string,
        buildDirectory: string,
        cancelToken?: CancelToken
    ): Promise<void> {
        if (cancelToken?.isCancelled) {
            throw new CancellationError(
                'CMake-based instrumentation was cancelled'
            )
        }
        await CommandExecution.execute({
            command: `${await this.wrapperInfo.cmakeWrapper} ${
                buildArguments || ''
            } ${srcDirectory}`,
            cwd: buildDirectory,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
        })
        fs.rmSync(buildDirectory + '/.discopop', {
            recursive: true,
            force: true,
        })
    }

    public async runMake(
        buildDirectory: string,
        cancelToken?: CancelToken
    ): Promise<void> {
        if (cancelToken?.isCancelled) {
            throw new CancellationError(
                'CMake-based instrumentation was cancelled'
            )
        }
        await CommandExecution.execute({
            command: `make`,
            cwd: buildDirectory,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
            env: {
                DOT_DISCOPOP: this.dotDiscopop,
            },
        })
    }

    /** the instrumentation is run multiple times, once for each entry in the executableArguments array */
    public async runInstrumentation(
        executableName: string,
        executableArguments: string[],
        buildDirectory: string,
        cancelToken?: CancelToken
    ): Promise<void> {
        if (cancelToken?.isCancelled) {
            throw new CancellationError(
                'CMake-based instrumentation was cancelled'
            )
        }
        for (const execArgs of executableArguments) {
            await CommandExecution.execute({
                command: `./${executableName} ${execArgs}`,
                cwd: buildDirectory,
                cancelToken: cancelToken,
                throwOnNonZeroExitCode: true,
                throwOnCancellation: true,
                env: {
                    DOT_DISCOPOP: this.dotDiscopop,
                },
            })
        }
    }
}
