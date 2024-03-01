import { CommandExecution } from '../../utils/CommandExecution'
import {
    CMakeBasedInstrumentation,
    WrapperInfo,
} from './CMakeBasedInstrumentation'

export class DiscoPoPCMakeBasedInstrumentation extends CMakeBasedInstrumentation {
    public constructor() {
        super()
    }

    public get wrapperInfo(): WrapperInfo {
        return new DiscoPoPProfilingWrapperInfo()
    }
}

class DiscoPoPProfilingWrapperInfo implements WrapperInfo {
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
}
