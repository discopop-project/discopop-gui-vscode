# Change Log

## 0.0.9

-   previewing of suggestions improved:
    -   separated preview from application
    -   settings to control previewing and application
-   do NOT show patterns that have applicable_pattern=false in patterns.json
-   option to override arguments for explorer, optimizer, hotspot_analysis

## 0.0.8

-   fix loading of results when hotspot detection was not executed
-   preview suggestion patches before applying the suggestion

## 0.0.7

-   automatically find installed DiscoPoP and HotspotDetection tools
-   remove settings to specify path to DiscoPoP and path to HotspotDetection
-   check that installed version of DiscoPoP is compatible with the extension; warn if installed DiscoPoP version may be incompatible

## 0.0.6

-   running the discopop optimizer (beta)
-   prioritize patterns.json created by the optimizer over the patterns.json created by the explorer
-   support for DiscoPoP 3.2

## 0.0.5

-   initial release
-   compatibility with DiscoPoP
