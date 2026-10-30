/**
 * Stackra file contract:
 * Purpose: `TreeViewDropTarget`, where dragged TreeView rows land: before or after a row, or inside it after its own
 *          children.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); STA-1371 (wave C, owner request
 *          2026-10-29).
 */

/** Where dragged rows land. */
export interface TreeViewDropTarget {
  /** The row the drop is relative to. */
  readonly id: string;
  /** `before` or `after` that row, at its level, or `inside` it, after its own children. */
  readonly position: "before" | "after" | "inside";
}
