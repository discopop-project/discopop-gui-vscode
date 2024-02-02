import {
    Configuration,
    ConfigurationObserver,
    ConfigurationType,
} from './Configuration'
import { ConfigurationCMake } from './configurationImplementations/ConfigurationCMake'
import { ConfigurationViewOnly } from './configurationImplementations/ConfigurationViewOnly'

export default function configurationFromJSON(
    json: any,
    observer: ConfigurationObserver
): Configuration {
    switch (json.configurationType) {
        case ConfigurationType.CMake:
            return new ConfigurationCMake(
                observer,
                json.name,
                json.projectPath,
                json.buildPath,
                json.executableName,
                json.executableArgumentsForDiscoPoP,
                json.executableArgumentsForHotspotDetection,
                json.buildArguments || '',
                json.overrideExplorerArguments || '',
                json.overrideOptimizerArguments || '',
                json.overrideHotspotDetectionArguments || ''
            )
        case ConfigurationType.ViewOnly:
            return new ConfigurationViewOnly(
                json.name,
                observer,
                json.dotDiscoPoP
            )
        default:
            throw new Error('Unknown configuration type')
    }
}
