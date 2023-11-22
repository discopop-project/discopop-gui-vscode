export interface Configuration {
    name: string
    runDiscoPoP?(): Promise<boolean>
    runHotspotDetection?(): Promise<boolean>

    getDotDiscoPoPForDiscoPoP?(): string
    getDotDiscoPoPForHotspotDetection?(): string
}

export interface DiscoPoPConfiguration extends Configuration {
    runDiscoPoP(): Promise<boolean>
    getDotDiscoPoPForDiscoPoP(): string
}

export interface HotspotDetectionConfiguration extends Configuration {
    runHotspotDetection(): Promise<boolean>
    getDotDiscoPoPForHotspotDetection(): string
}

export interface DiscoPoPAndHotspotDetectionConfiguration
    extends Configuration {
    runDiscoPoP(): Promise<boolean>
    runHotspotDetection(): Promise<boolean>

    getDotDiscoPoPForDiscoPoP(): string
    getDotDiscoPoPForHotspotDetection(): string
}

export class CMakeConfiguration
    implements DiscoPoPAndHotspotDetectionConfiguration
{
    public constructor(
        public name: string,
        public projectRoot: string,
        public buildDirectory: string,
        public executableName: string,
        public executableArgumentsDiscoPoP: string,
        public executableArgumentsHotspotDetection: string[],
        public buildArguments: string
    ) {}

    public async runDiscoPoP(): Promise<boolean> {
        throw new Error('Method not implemented.') // TODO
    }

    public async runHotspotDetection(): Promise<boolean> {
        throw new Error('Method not implemented.') // TODO
    }

    public getDotDiscoPoPForDiscoPoP(): string {
        return `${this.buildDirectory}/.discopop`
    }

    public getDotDiscoPoPForHotspotDetection(): string {
        return `${this.buildDirectory}/.discopop`
    }
}
