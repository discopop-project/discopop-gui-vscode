import { ExtensionContext } from 'vscode'

export abstract class StateManager {
    private constructor() {
        throw new Error('This class should not be instantiated')
    }

    public static save(context: ExtensionContext, entry: string, value: any) {
        return context.workspaceState.update(entry, value)
    }

    public static read(context: ExtensionContext, entry: string): any {
        return context.workspaceState.get(entry)
    }
}
