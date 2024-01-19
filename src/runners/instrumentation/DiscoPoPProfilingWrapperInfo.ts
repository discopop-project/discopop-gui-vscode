import { DiscoPoPConfigProvider } from '../tools/DiscoPoPConfigProvider'
import { WrapperInfo } from './CMakeBasedInstrumentation'

export class DiscoPoPProfilingWrapperInfo implements WrapperInfo {
    public constructor() {}
    private _configProvider: DiscoPoPConfigProvider =
        new DiscoPoPConfigProvider()

    private _cmakeWrapper: Promise<string> | undefined = undefined
    public get cmakeWrapper(): Promise<string> {
        if (this._cmakeWrapper === undefined) {
            this._cmakeWrapper = this._configProvider.buildDirectory.then(
                (build) => build + '/scripts/CMAKE_wrapper.sh'
            )
        }
        return this._cmakeWrapper
    }

    // TODO use promises for all of these
    private _ccWrapper: string | undefined = undefined
    public get ccWrapper(): string {
        if (this._ccWrapper === undefined) {
            this._ccWrapper =
                this._configProvider.buildDirectory + '/scripts/CC_wrapper.sh'
        }
        return this._ccWrapper
    }

    private _cxxWrapper: string | undefined = undefined
    public get cxxWrapper(): string {
        if (this._cxxWrapper === undefined) {
            this._cxxWrapper =
                this._configProvider.buildDirectory + '/scripts/CXX_wrapper.sh'
        }
        return this._cxxWrapper
    }

    private _ldWrapper: string | undefined = undefined
    public get ldWrapper(): string {
        if (this._ldWrapper === undefined) {
            this._ldWrapper =
                this._configProvider.buildDirectory +
                '/scripts/LINKER_wrapper.sh'
        }
        return this._ldWrapper
    }

    private _mpiccWrapper: string | undefined = undefined
    public get mpiccWrapper(): string {
        if (this._mpiccWrapper === undefined) {
            this._mpiccWrapper =
                this._configProvider.buildDirectory +
                '/scripts/MPI_CC_wrapper.sh'
        }
        return this._mpiccWrapper
    }

    private _mpicxxWrapper: string | undefined = undefined
    public get mpicxxWrapper(): string {
        if (this._mpicxxWrapper === undefined) {
            this._mpicxxWrapper =
                this._configProvider.buildDirectory +
                '/scripts/MPI_CXX_wrapper.sh'
        }
        return this._mpicxxWrapper
    }

    private _mpildWrapper: string | undefined = undefined
    public get mpildWrapper(): string {
        if (this._mpildWrapper === undefined) {
            this._mpildWrapper =
                this._configProvider.buildDirectory +
                '/scripts/MPI_LINKER_wrapper.sh'
        }
        return this._mpildWrapper
    }
}
