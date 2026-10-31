/**
 * Stackra file contract:
 * Purpose: `TreeLayout`, a laid-out tree diagram in pixels: each node's point, path and figure, and each link's curve
 *          (`treeLayoutOf`).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { TreeDiagramItem } from "#contracts/types/tree-diagram-item.type";

/** The nodes' points and the links' curves. */
export interface TreeLayout {
  /** Every node, depth first, with its point. */
  readonly nodes: readonly {
    readonly item: TreeDiagramItem;
    /** The labels from the top node down to this one. */
    readonly trail: readonly string[];
    readonly depth: number;
    /** The palette position of its branch; -1 for a lone root, which is drawn quiet. */
    readonly branch: number;
    readonly x: number;
    readonly y: number;
    /** Its own value, or the sum of its children's; undefined when the tree carries no values. */
    readonly value: number | undefined;
    readonly isLeaf: boolean;
  }[];
  /** One curve from each parent to each child. */
  readonly links: readonly { readonly key: string; readonly branch: number; readonly path: string }[];
  /** How many levels deep the tree goes, counting the top. */
  readonly depth: number;
}
