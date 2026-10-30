/**
 * Stackra file contract:
 * Purpose: `TreeViewNode`, one row of a `TreeView` and the rows nested under it.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory (2026-10-28) row 22.
 */
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** One row of a tree: an account, a category, a team or a part, with the rows under it. */
export interface TreeViewNode {
  /** The key the selection and the expanded set hold; unique in the whole tree. */
  readonly id: string;
  /** The text of the row; it is also its accessible name. */
  readonly label: string;
  /** A second, muted text after the label, for example an account code or a count. */
  readonly description?: string | undefined;
  /** An icon drawn before the label: an icon name or any icon element. */
  readonly icon?: IconSlot | undefined;
  /** True to show the row but refuse selecting it. */
  readonly isDisabled?: boolean | undefined;
  /** The rows nested under this one; a row with children can be expanded. */
  readonly children?: readonly TreeViewNode[] | undefined;
  /**
   * True when the row has children that are not loaded yet: it can be expanded, and the tree's `onLoadChildren` is
   * called the first time it is.
   */
  readonly hasChildren?: boolean | undefined;
}
