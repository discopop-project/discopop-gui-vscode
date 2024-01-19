import { Config } from '../../Utils/Config'
import { WrapperInfo } from './CMakeBasedInstrumentation'

export class HotspotDetectionProfilingWrapperInfo implements WrapperInfo {
    public constructor() {}

    public get cmakeWrapper(): Promise<string> {
        return Promise.resolve(
            `${Config.hotspotDetectionBuild()}/scripts/CMAKE_wrapper.sh`
        )
    }
}
