/**
 * Stackra file contract:
 * Purpose: `EditorState`, what an editor shows at one moment: the document tree, the selected blocks and whether undo
 *          and redo can run.
 * Boundary: a type only, in the leaf entry. A state is frozen and replaced, never mutated, on each change, so it is a
 *           `useSyncExternalStore` snapshot. `selection` keeps its identity while the selection does not change.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 4: selection, the undo and redo command stack).
 */
import type { EditorNode } from "#contracts/types/editor-node.type";

/** One editor snapshot. */
export interface EditorState {
  /** The document's root block; the serialised document as it stands. */
  readonly root: EditorNode;

  /** The ids of the selected blocks, in selection order; every one is in the tree. */
  readonly selection: readonly string[];

  /** Whether `undo()` has a change to revert. */
  readonly canUndo: boolean;

  /** Whether `redo()` has a change to apply again. */
  readonly canRedo: boolean;
}
