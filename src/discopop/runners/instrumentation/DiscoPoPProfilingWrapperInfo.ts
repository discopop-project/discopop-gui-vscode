import { CommandExecution } from '../../../utils/CommandExecution'
import { ToolSuite } from '../tools/ToolSuite'
import { WrapperInfo } from './CMakeBasedInstrumentation'

export class DiscoPoPProfilingWrapperInfo implements WrapperInfo {
    public constructor() {}

    public get cmakeWrapper(): Promise<string> {
        return CommandExecution.commandExists(
            'discopop_cmake',
            true,
            'Is DiscoPoP installed?'
        ).then((exists) => {
            return 'discopop_cmake'
        })
    }

    public get ccWrapper(): Promise<string> {
        return CommandExecution.commandExists(
            'discopop_cc',
            true,
            'Is DiscoPoP installed?'
        ).then((exists) => {
            return 'discopop_cc'
        })
    }

    public get cxxWrapper(): Promise<string> {
        return CommandExecution.commandExists(
            'discopop_cxx',
            true,
            'Is DiscoPoP installed?'
        ).then((exists) => {
            return 'discopop_cxx'
        })
    }

    private _ldWrapper: Promise<string> | undefined = undefined
    public get ldWrapper(): Promise<string> {
        if (this._ldWrapper === undefined) {
            this._ldWrapper =
                ToolSuite.discopopConfigProvider.buildDirectory.then(
                    (build) => build + '/scripts/LINKER_wrapper.sh'
                )
        }
        return this._ldWrapper
    }

    private _mpiccWrapper: Promise<string> | undefined = undefined
    public get mpiccWrapper(): Promise<string> {
        if (this._mpiccWrapper === undefined) {
            this._mpiccWrapper =
                ToolSuite.discopopConfigProvider.buildDirectory.then(
                    (build) => build + '/scripts/MPI_CC_wrapper.sh'
                )
        }
        return this._mpiccWrapper
    }

    private _mpicxxWrapper: Promise<string> | undefined = undefined
    public get mpicxxWrapper(): Promise<string> {
        if (this._mpicxxWrapper === undefined) {
            this._mpicxxWrapper =
                ToolSuite.discopopConfigProvider.buildDirectory.then(
                    (build) => build + '/scripts/MPI_CXX_wrapper.sh'
                )
        }
        return this._mpicxxWrapper
    }

    private _mpildWrapper: Promise<string> | undefined = undefined
    public get mpildWrapper(): Promise<string> {
        if (this._mpildWrapper === undefined) {
            this._mpildWrapper =
                ToolSuite.discopopConfigProvider.buildDirectory.then(
                    (build) => build + '/scripts/MPI_LINKER_wrapper.sh'
                )
        }
        return this._mpildWrapper
    }
}
