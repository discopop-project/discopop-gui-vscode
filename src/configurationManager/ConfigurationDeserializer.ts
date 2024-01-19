import {
    Configuration,
    ConfigurationObserver,
    ConfigurationType,
} from './Configuration'
import { ConfigurationCMake } from './configurationImplementations/ConfigurationCMake'
import { ConfigurationScript } from './configurationImplementations/ConfigurationScript'
import { ConfigurationViewOnly } from './configurationImplementations/ConfigurationViewOnly'

export default function configurationFromJSON(
    json: any,
    observer: ConfigurationObserver
): Configuration {
    switch (json.configurationType) {
        case ConfigurationType.CMake:
            return new ConfigurationCMake(
                json.name,
                json.projectPath,
                json.buildPath,
                json.buildArguments,
                json.executableName,
                json.executableArgumentsForDiscoPoP,
                json.executableArgumentsForHotspotDetection,
                observer
            )
        case ConfigurationType.ViewOnly:
            return new ConfigurationViewOnly(
                json.name,
                observer,
                json.dotDiscoPoP
            )
        case ConfigurationType.Script:
            return new ConfigurationScript(
                json.name,
                observer,
                json.dotDiscoPoP,
                json.discopopScriptPath,
                json.hotspotDetectionScriptPath
            )
        default:
            throw new Error('Unknown configuration type')
    }
}
