import { exec } from 'child_process'
import { CancelToken } from './cancellation/CancelToken'
import { CancellationError } from './cancellation/CancellationError'

export interface CommandExecutionOptions {
    /** the command to be executed, including arguments */
    command: string

    /** current working directory; defaults */
    cwd?: string

    /**  */
    env?: NodeJS.Dict<string>

    /** optionally provide a way to cancel a started command*/
    cancelToken?: CancelToken

    /** defaults to false */
    throwOnNonZeroExitCode?: boolean

    /** defaults to false */
    throwOnCancellation?: boolean

    /** defaults to true in CommandExecution*/
    trimOutput?: boolean
}

export interface ExecutionResult {
    stdout: string
    stderr: string
    cancelled: boolean
    exitCode: number
}

export class CommandExecution {
    private constructor() {
        throw new Error('This class cannot be instantiated.')
    }

    public static execute(
        options: CommandExecutionOptions
    ): Promise<ExecutionResult> {
        if (options.trimOutput === undefined) {
            options.trimOutput = true
        }
        return new Promise<ExecutionResult>((resolve, reject) => {
            const childProcess = exec(
                options.command,
                {
                    cwd: options.cwd,
                    env: {
                        ...process.env,
                        ...options.env,
                    },
                },
                (err, stdout, stderr) => {
                    if (options.trimOutput) {
                        stdout = stdout.trim()
                        stderr = stderr.trim()
                    }

                    if (err) {
                        if (err.killed) {
                            if (options.throwOnCancellation) {
                                reject(
                                    new CancellationError(
                                        `command was cancelled: ${options.command}`
                                    )
                                )
                                return
                            } else {
                                resolve({
                                    stdout: stdout,
                                    stderr: stderr,
                                    cancelled: true,
                                    exitCode: 0,
                                })
                                return
                            }
                        } else if (err.code !== 0) {
                            if (options.throwOnNonZeroExitCode) {
                                reject(err)
                                return
                            } else {
                                resolve({
                                    stdout: stdout,
                                    stderr: stderr,
                                    cancelled: false,
                                    exitCode: err.code,
                                })
                                return
                            }
                        } else {
                            reject(err)
                            return
                        }
                    } else {
                        resolve({
                            stdout: stdout,
                            stderr: stderr,
                            cancelled: false,
                            exitCode: 0,
                        })
                        return
                    }
                }
            )
            if (options.cancelToken) {
                options.cancelToken.onCancel(async () => {
                    if (!childProcess.kill()) {
                        console.error(
                            'failed to kill process using SIGTERM, trying to kill it using SIGKILL'
                        )
                        if (!childProcess.kill('SIGKILL')) {
                            console.error(
                                'failed to kill process using SIGTERM and SIGKILL'
                            )
                            console.error(childProcess)
                            reject(
                                new CancellationError(
                                    'Operation was cancelled: a started process could not be killed using SIGTERM or SIGKILL (PID:' +
                                        childProcess.pid +
                                        ')'
                                )
                            )
                        }
                    } else {
                        console.log(
                            'killed process (command: ' + options.command + ')'
                        )
                    }
                })
            }
        })
    }
}
