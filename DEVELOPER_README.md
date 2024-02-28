# Overview of the extension for Developers

## Getting Started

**Prerequisites:**

-   nodejs 20 and npm 10 is installed
-   vscode is installed

**Environment:**

-   The extension development is known to work well using WSL2.0 on Windows 11.
    -   Using a Linux Distribution or other Windows versions with WSL should also work, but it was not tested at the time of writing this documentation.
    -   Since the DiscoPoP tools do not support Windows anyways, no measures were taken to explicitly support pure Windows (without WSL) environments, though in theory it should be possible.

**Installation:**

-   Clone the repository (e.g. inside WSL: `git clone git@github.com:discopop-project/discopop-gui-vscode.git`)
-   Open the directory in vscode (e.g. `code .` while being in the root directory)
-   run `npm install` in the root directory of the project.

**NOTE:** During the installation git hooks will be created to automatically format the source code in pre-commit hooks using [husky](https://typicode.github.io/husky/). The hooks also enforce the use of [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)

**Running:**

-   Press F5 to start the extension in debug mode

Tip: The debugging support of vs code is quite good: Set breakpoints and then inspect values while stepping through the program.

## Helpful resources

-   Icons:
    -   https://microsoft.github.io/vscode-codicons/dist/codicon.html
    -   https://code.visualstudio.com/api/references/icons-in-labels#icon-listing
-   API Documentation:
    -   https://code.visualstudio.com/api

## Creating Releases

-   update the version in package.json
-   run `npm install` to update the package-lock.json as well
-   update the CHANGELOG.md
-   update the README.md compatibility table
-   create a release using the github user interface

## Dependency-Graph

Sometimes it is helpful to see dependencies between source files. You can use [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) to create text or graph representations of all dependencies. `npm run depcruise` will create an overview in `dependency-graph.svg`. Requires graphviz to be installed! (`sudo apt install graphviz`)
