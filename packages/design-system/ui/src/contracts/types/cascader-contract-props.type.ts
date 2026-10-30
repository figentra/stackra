/**
 * Stackra file contract:
 * Purpose: `CascaderContractProps`, the props every runtime's `Cascader` takes: a field that picks a path through a
 *          hierarchy (country, region, city) one level at a time, side-by-side columns on web and a drill-down sheet on
 *          native, and shows the chosen path ("Saudi Arabia / Riyadh / Al Olaya").
 * Boundary: types only; the rows are TreeSelect's `TreeViewNode`s and the value is the ids of the path, from the top
 *           row to the chosen leaf.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (one field contract); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { TreeViewNode } from "#contracts/types/tree-view-node.type";

/** Props shared by the web and native `Cascader`. */
export interface CascaderContractProps extends FieldContractProps<readonly string[]> {
  /** The top rows; each row's `children` are the next level. */
  readonly items: readonly TreeViewNode[];
  /** The text of the empty field; defaults to the catalogue's "Choose". */
  readonly placeholder?: string | undefined;
  /** Loads the rows under a row marked `hasChildren` the first time it is opened. */
  readonly onLoadChildren?: ((id: string) => Promise<readonly TreeViewNode[]>) | undefined;
}
