import { CommandExecution } from '../../utils/CommandExecution'
import {
    CMakeBasedInstrumentation,
    WrapperInfo,
} from './CMakeBasedInstrumentation'

export class HotspotDetectionCMakeBasedInstrumentation extends CMakeBasedInstrumentation {
    public constructor() {
        super()
    }

    public get wrapperInfo(): WrapperInfo {
        return new HotspotDetectionProfilingWrapperInfo()
    }
}

class HotspotDetectionProfilingWrapperInfo implements WrapperInfo {
    public constructor() {}

    public get cmakeWrapper(): Promise<string> {
        return CommandExecution.commandExists(
            'discopop_hotspot_cmake',
            true,
            'Is the Hotspot Detection tool installed?'
        ).then((exists) => {
            return 'discopop_hotspot_cmake'
        })
    }
}
