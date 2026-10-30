/**
 * Stackra file contract:
 * Purpose: `TreeSelectContractProps`, the props every runtime's `TreeSelect` takes: a field whose options are a tree
 *          (categories, accounts, departments, locations), choosing one row or several from a TreeView in a popover.
 * Boundary: types only; the value is the chosen ids in the order the rows are listed.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (one field contract); STA-1371 (wave C, owner request
 *          2026-10-29).
 */
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { TreeViewNode } from "#contracts/types/tree-view-node.type";

/** Props shared by the web and native `TreeSelect`. */
export interface TreeSelectContractProps extends FieldContractProps<readonly string[]> {
  /** The rows to choose from. */
  readonly items: readonly TreeViewNode[];
  /** `single` (the default) closes on a choice; `multiple` ticks rows and stays open. */
  readonly selectionMode?: "single" | "multiple" | undefined;
  /** With `multiple`: ticking a row ticks every row under it, and a partly ticked row shows a dash. Defaults to true. */
  readonly isSelectionPropagated?: boolean | undefined;
  /** The text of the empty field; defaults to the catalogue's "Choose". */
  readonly placeholder?: string | undefined;
  /** The ids expanded when the list first opens. */
  readonly defaultExpandedKeys?: readonly string[] | undefined;
  /** Loads the rows under a row marked `hasChildren`, as on TreeView. */
  readonly onLoadChildren?: ((id: string) => Promise<readonly TreeViewNode[]>) | undefined;
}
