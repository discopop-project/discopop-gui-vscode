import * as fs from 'fs'
import { CommandExecution } from '../../../utils/CommandExecution'
import { CancelToken } from '../../../utils/cancellation/CancelToken'
import { CancellationError } from '../../../utils/cancellation/CancellationError'

export interface WrapperInfo {
    readonly cmakeWrapper: Promise<string>
    readonly ccWrapper?: Promise<string>
    readonly cxxWrapper?: Promise<string>
    readonly ldWrapper?: Promise<string>
    readonly mpiccWrapper?: Promise<string>
    readonly mpicxxWrapper?: Promise<string>
    readonly mpildWrapper?: Promise<string>
}

export interface CMakeProjectInfo {
    readonly srcDirectory: string
    readonly buildDirectory: string
    readonly executableName: string
    /** the executable will be run once for each entry in the array, providing the entry as command line arguments */
    readonly executableArguments: string[]
    readonly buildArguments?: string
}

export class CMakeBasedInstrumentation {
    public constructor(
        public readonly dotDiscoPoP: string,
        public readonly wrapperInfo: WrapperInfo,
        public readonly projectInfo: CMakeProjectInfo
    ) {
        // cmake has some compiler tests that mess up our results
        // implemented workaround:
        //  --> run cmake without providing a path to .discopop --> will create a local .discopop directory
        //  --> then delete the local .discopop directory as it only contains invalid information
        // this fix requires however that the provided .discopop directory is not the same as the local .discopop directory
        // (otherwise we might delete information that we still need, e.g. results from other instrumentation passes)
        if (dotDiscoPoP === projectInfo.buildDirectory + '/.discopop') {
            throw new Error(
                'Currently we do not support .discopop inside the build directory. Please provide a different location for .discopop.'
            )
        }
    }

    public prepareBuildDirectory(): void {
        fs.rmSync(this.projectInfo.buildDirectory, {
            recursive: true,
            force: true,
        })
        fs.mkdirSync(this.projectInfo.buildDirectory, { recursive: true })
    }

    public async runCmake(cancelToken?: CancelToken): Promise<void> {
        if (cancelToken?.isCancelled) {
            throw new CancellationError(
                'CMake-based instrumentation was cancelled'
            )
        }
        await CommandExecution.execute({
            command: `${await this.wrapperInfo.cmakeWrapper} ${
                this.projectInfo.buildArguments || ''
            } ${this.projectInfo.srcDirectory}`,
            cwd: this.projectInfo.buildDirectory,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
        })
        fs.rmSync(this.projectInfo.buildDirectory + '/.discopop', {
            recursive: true,
            force: true,
        })
    }

    public async runMake(cancelToken?: CancelToken): Promise<void> {
        if (cancelToken?.isCancelled) {
            throw new CancellationError(
                'CMake-based instrumentation was cancelled'
            )
        }
        await CommandExecution.execute({
            command: `make`,
            cwd: this.projectInfo.buildDirectory,
            cancelToken: cancelToken,
            throwOnNonZeroExitCode: true,
            throwOnCancellation: true,
            env: {
                DOT_DISCOPOP: this.dotDiscoPoP,
            },
        })
    }

    /** if the executable arguments are an array, then the instrumentation is run multiple times, once for each entry in the array */
    public async runInstrumentation(cancelToken?: CancelToken): Promise<void> {
        if (cancelToken?.isCancelled) {
            throw new CancellationError(
                'CMake-based instrumentation was cancelled'
            )
        }
        for (const execArgs of this.projectInfo.executableArguments) {
            await CommandExecution.execute({
                command: `./${this.projectInfo.executableName} ${execArgs}`,
                cwd: this.projectInfo.buildDirectory,
                cancelToken: cancelToken,
                throwOnNonZeroExitCode: true,
                throwOnCancellation: true,
                env: {
                    DOT_DISCOPOP: this.dotDiscoPoP,
                },
            })
        }
    }
}
