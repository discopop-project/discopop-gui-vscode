import { SimpleTreeNode } from '../../utils/SimpleTree'

/** super class for everything that should be shown in the data dependency Tree */
export interface TreeNode extends SimpleTreeNode<TreeNode> {
    getView(): import('vscode').TreeItem
    getChildren(): TreeNode[] | undefined
    refresh(): void
}
