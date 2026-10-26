/**
 * Stackra file contract:
 * Purpose: `DocumentEditorState`, what a structured document editor holds: the document as it stands and whether an
 *          undo or a redo is possible.
 * Boundary: a type only; a frozen `useSyncExternalStore` snapshot, replaced on every change.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decision 3); ADR 0270 (decisions 4 and 6).
 */

/** A structured editor's state. */
export interface DocumentEditorState<T> {
  /** The document as it stands. */
  readonly document: T;

  /** Whether `undo()` has a step to take back. */
  readonly canUndo: boolean;

  /** Whether `redo()` has a step to take again. */
  readonly canRedo: boolean;
}
