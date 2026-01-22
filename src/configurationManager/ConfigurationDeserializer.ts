import {
    Configuration,
    ConfigurationObserver,
    ConfigurationType,
} from './Configuration'
import { ConfigurationCMake } from './cmake/ConfigurationCMake'
import { ConfigurationViewOnly } from './viewOnly/ConfigurationViewOnly'

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
                json.dotDiscoPoP,
                json.projectPath,
                json.scripts
            )
        default:
            throw new Error('Unknown configuration type')
    }
}
