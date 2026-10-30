/**
 * Stackra file contract:
 * Purpose: the props every runtime's `TreeView` takes: the nested rows, the tree's accessible name, the selection
 *          (none, one or several) and the expanded rows, each controlled or uncontrolled. Each runtime's
 *          `TreeViewProps` is this plus its root element's own props, which pass through unchanged.
 * Boundary: types only. A tree table is a tree whose rows carry their columns in `description`; there is no column
 *           layout here.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); design-system gap inventory (2026-10-28) row 22.
 */
import type { SelectionContractProps } from "#contracts/types/selection-contract-props.type";
import type { TreeViewDropTarget } from "#contracts/types/tree-view-drop-target.type";
import type { TreeViewNode } from "#contracts/types/tree-view-node.type";

/** Props shared by the web and native `TreeView`. */
export interface TreeViewContractProps extends SelectionContractProps {
  /** The top-level rows, in order. */
  readonly items: readonly TreeViewNode[];
  /** The accessible name of the tree, for example "Chart of accounts". */
  readonly label: string;
  /** The ids of the expanded rows, for a controlled tree; pair it with `onExpandedChange`. */
  readonly expandedKeys?: readonly string[] | undefined;
  /** The ids expanded at the start, for an uncontrolled tree. */
  readonly defaultExpandedKeys?: readonly string[] | undefined;
  /** Called with the ids now expanded each time a row opens or closes. */
  readonly onExpandedChange?: ((keys: readonly string[]) => void) | undefined;
  /** Called with a row's id when it is activated (pressed, or Enter on web). */
  readonly onAction?: ((id: string) => void) | undefined;
  /**
   * True with `selectionMode="multiple"`: checking a row checks every row under it, a row is checked once all its
   * rows are, and a row with only some of its rows checked shows a dash. The selection holds every checked id.
   */
  readonly isSelectionPropagated?: boolean | undefined;
  /**
   * Loads the children of a row marked `hasChildren` the first time it is expanded. A spinner row shows while the
   * promise is pending and the tree keeps the rows it resolves to; a rejection closes the row so it can be tried again.
   */
  readonly onLoadChildren?: ((id: string) => Promise<readonly TreeViewNode[]>) | undefined;
  /**
   * Called when rows are dragged (or moved from the keyboard) to a new place: before or after a row, or inside it.
   * Given, rows can be dragged on web; the tree does not move them itself, so update `items` (`moveTreeNodes` does
   * it). Native has no dragging and ignores it.
   */
  readonly onMove?: ((ids: readonly string[], target: TreeViewDropTarget) => void) | undefined;
}
