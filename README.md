# DiscoPoP

An extension for the Parallelism Discovery tool [DiscoPoP](https://www.discopop.tu-darmstadt.de/).

## Requirements

This extension requires a working installation of [DiscoPoP](https://github.com/discopop-project/discopop) and the [HotspotDetection](https://github.com/discopop-project/Hotspot-Detection).

## How to use

First go to the extension settings (File->Preferences->Settings->Extensions->DiscoPoP) and tell us where to find your DiscoPoP and HotspotDetection installations.

Then you can open the DiscoPoP view. It is located in the same area as the file explorer and the search view.

To analyze a Project, we need to know where to find it and how to interact with it. This is done in the projects view. Create a configuration and follow the setup process.

Now you can run or load DiscoPoP and HotspotDetection from the projects view.

More information can be found in the [DiscoPoP Wiki](https://discopop-project.github.io/discopop/)

## Supported Versions

The following table lists which discopop version is expected by a given version of this extension. Other versions may still work, however compatibility cannot be guaranteed.

| Extension Version | DiscoPoP Version |
| ----------------- | ---------------- |
| 0.0.6             | 3.1.1            |
| 0.0.5             | 3.0.0            |
| pre 0.0.5         | not specified    |

-   not officially released

## Known Issues

-   CMake Configurations: Running the same tool multiple times sometimes creates issues. It usually helps to delete the build directory. A proposed fix is scheduled for DiscoPoP 4.0.0.
