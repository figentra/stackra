/**
 * Stackra file contract:
 * Purpose: `AppliedChange`, what applying one change gives: the new tree and the change that reverts it.
 * Boundary: a type only, internal to the core entry; the inverse is computed against the tree the change was applied
 *           to, so undo restores exactly what was there.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 4: the undo and redo command stack).
 */
import type { EditorNode, EditorChange } from "#contracts/index";

/** One applied change. */
export interface AppliedChange {
  /** The tree after the change. */
  readonly root: EditorNode;

  /** The change that turns `root` back into the tree before it. */
  readonly inverse: EditorChange;
}
