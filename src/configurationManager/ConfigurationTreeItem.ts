import { SimpleTreeNode } from '../utils/SimpleTree'

/** super class for everything that should be shown in the Configuration Tree */
export interface ConfigurationTreeItem
    extends SimpleTreeNode<ConfigurationTreeItem> {
    getView(): import('vscode').TreeItem
    getChildren(): ConfigurationTreeItem[] | undefined
}
