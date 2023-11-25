import {
    Configuration,
    ConfigurationObserver,
    ConfigurationType,
} from './Configuration'
import { ConfigurationCMake } from './ConfigurationCMake'
import { ConfigurationViewOnly } from './ConfigurationViewOnly'

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
                json.dotDiscoPoPForDiscoPoP,
                json.dotDiscoPoPForHotspotDetection
            )
        case ConfigurationType.Script: // TODO
        default:
            throw new Error('Unknown configuration type')
    }
}
