# DiscoPoP

An extension for the Parallelism Discovery tool [DiscoPoP](https://www.discopop.tu-darmstadt.de/).

## Requirements

This extension requires a working installation of [DiscoPoP](https://github.com/discopop-project/discopop) and the [HotspotDetection](https://github.com/discopop-project/Hotspot-Detection).

## How to use

Open the DiscoPoP view. It is located in the same area as the file explorer and the search view.

To analyze a Project, we need to know where to find it and how to interact with it. This is done in the configurations view. Click on the plus sign to create a configuration and input the required information.

Now you can run or load DiscoPoP and HotspotDetection from the configurations view.

A more detailed guide can be found in the [DiscoPoP Wiki](https://discopop-project.github.io/discopop/) along with more information about DiscoPoP.

## Supported Versions

The following table lists which discopop version is expected by a given version of this extension. Other versions may still work, however compatibility cannot be guaranteed.

| Extension Version | DiscoPoP Version |
| ----------------- | ---------------- |
| 0.1.1             | 3.2.0            |
| 0.1.0             | 3.2.0            |
| 0.0.6 - 0.0.11    | 3.2.0            |
| 0.0.5             | 3.0.0            |
| pre 0.0.5         | not specified    |

## Known Issues

-   CMake Configurations: Running the same tool multiple times creates some issues, e.g the same suggestions appearing multiple times. It usually helps to delete the build directory. A proposed fix is scheduled for DiscoPoP 4.0.0.
-   Updating from 0.0.5 to newer versions crashes the extension if Script Configurations have been previously created, as all newer versions do not support them. We recommend to delete script configurations before updating the extension.
