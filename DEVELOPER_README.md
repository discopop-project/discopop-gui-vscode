# Overview of the extension for Developers

## Getting Started

Prerequisites:

-   nodejs 20 and npm 10 is installed
-   vscode is installed

Environment:

-   The extension development is known to work well using WSL2.0 on Windows 11.
    -   Using a Linux Distribution or other Windows versions with WSL should also work, but it was not tested at the time of writing this documentation.
    -   Since the DiscoPoP tools do not support Windows anyways, no measures were taken to explicitly support pure Windows (without WSL) environments, though in theory it should be possible.

Installation:

-   Clone the repository (e.g. inside WSL: `git clone git@github.com:discopop-project/discopop-gui-vscode.git`)
-   Open the directory in vscode (e.g. `code .` while being in the root directory)
-   run `npm install` in the root directory of the project.

The installation will also install some git hooks that automatically format the source code in pre-commit hooks using husky.

Running:

-   Press F5 to start the extension in debug mode

Tip: The debugging support of vs code is quite good: Set breakpoints and then inspect values while stepping through the program.

## Helpful resources

-   Icons:
    -   https://microsoft.github.io/vscode-codicons/dist/codicon.html
    -   https://code.visualstudio.com/api/references/icons-in-labels#icon-listing
-   API Documentation:
    -   https://code.visualstudio.com/api

## Overview of the Code

-   **extension.ts and DiscoPoPExtension.ts:**\
    The extension is started by vscode by calling the extension.ts::activate function when a "activation event" happens. In our case the activation event is the user trying to view any DiscoPoP view. The main part of the controlling logic is however outsourced to DiscoPoPExtension.ts. The DiscoPoPExtension class is the central component that manages all views and commands. (Commands are usually triggered by the user doing something in the UI, e.g. clicking on a button, but they can also be triggered programatically. CTR+Shift+P also is another way for users to trigger commands explicitly.)

-   **configurationManager:**\
    The configurationManager is responsible for the "CONFIGURATIONS" view and the management of the underlying data.

    -   configurations are stored in json format in a workspace-specific storage, provided by the VS Code API. ConfigurationImplementations must therefore provide a toJSON method and the ConfigurationDeserializer must be extended if new types of Configurations are added or when the json format is changed.

-   **runners:** \
    All HotspotDetection and DiscoPoP tools and common workflows are modeled in this directory.

    -   **tools:** Each of the discopop tools (e.g. explorer, optimizer, ...) has a separate class that provides an interface to run it. Usually the constructor takes the path to the .discopop directory and then several functions exist to run the tool in different ways. For convenience all tools are additionally bundled in the **ToolSuite**.
    -   **instrumentation:** Both the DiscoPoP and the HotspotDetection tool use a similar approach to instrumenting an executable. Therefore a universal way to run any instrumentation that employs the same scheme was implemented in the CMakeBasedInstrumentation class.
    -   **workflows:** workflows combine multiple steps of running DiscoPoP, e.g. the workflow of building a CMake Project, running the instrumentation, then running the explorer, running the patch-generator and finally parsing the results. Special care was taken to separate the execution logic and user interaction. The workflow implementations take callback functions that are then used to show progress to the user or allow cancellation. The ...WorkflowUI classes then wrap the workflow with UI functionality that displays said progress with pretty notifications etc..

-   **discoPoP:** logic and data structures that are only related to DiscoPoP.
-   **hotspotDetection:** logic and data structures that are only related to the HotspotDetection.
-   **fileMapping and lineMapping:** logic and data structures that are used by both DiscoPoP and the HotspotDetection.

-   **utils:**:
    -   **Commands.ts:** string literals for all command identifiers
    -   **Config.ts:** unified access to extension settings
    -   **Decorations.ts:** constants for editorDecoration styles to highlight suggestions/hotspots
    -   **JSONWebViewProvider:** functionality to show json files in a vs code view. (e.g. Suggestion Details, Hotspot Details)
    -   **SimpleTree:** base class for tree views, (e.g. Configurations and Suggestions views.)
    -   **UIPrompts:** helpers to simplify user interaction

## Creating Releases

-   update the version in package.json
-   `npm install` (to update the package-lock.json as well)
-   update the CHANGELOG.md
-   update the README.md compatibility table
-   create a release using the github user interface

## Dependency-Graph

Sometimes it is helpful to see dependencies between source files. [More info](https://github.com/sverweij/dependency-cruiser).

    npx depcruise src --include-only "^src" --output-type dot | dot -T svg > dependency-graph.svg
