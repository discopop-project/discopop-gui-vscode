// import { TreeItem } from "vscode";
// import { Configuration, ConfigurationType, DiscoPoPViewCapableConfiguration, HotspotDetectionViewCapableConfiguration } from "./Configuration"
// import { ConfigurationTreeItem } from "./ConfigurationTreeItem";
// import { StringProperty } from "./Property";

// export class ConfigurationViewOnly extends Configuration implements DiscoPoPViewCapableConfiguration, HotspotDetectionViewCapableConfiguration {

//     public constructor(name: string, dotDiscoPoP: string) {
//         super(name)
//         this.dotDiscoPoP = new StringProperty("Path to .discopop", dotDiscoPoP, "Path to the .discopop directory containing the results of the DiscoPoP and/or Hotspot Detection runs.")
//     }

//     dotDiscoPoP: StringProperty;

//     getView(): TreeItem {
//         throw new Error("Method not implemented.");
//     }
//     getChildren(): ConfigurationTreeItem[] {
//         throw new Error("Method not implemented.");
//     }
//     configurationType: ConfigurationType.ViewOnly;
//     toJSON(): any {
//         throw new Error("Method not implemented.");
//     }
//     getDotDiscoPoPForDiscoPoP(): string {
//         throw new Error("Method not implemented.");
//     }
//     getDotDiscoPoPForHotspotDetection(): string {
//         throw new Error("Method not implemented.");
//     }
// }

// // TODO note to self: we should only have a single "load results" button, which will try to find discopop and hotspot detection results and will load whatever exists
