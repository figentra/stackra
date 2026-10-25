/**
 * Stackra file contract:
 * Purpose: `PickFolderOutput`, what `PickFolderBridge` answers: the absolute path of the folder the user chose, or
 *          `null` when they cancelled.
 * Boundary: a type only. The path is the user's own, on the user's machine; it is never sent to a server by this
 *           package.
 * Runtime: isomorphic
 * Governing contract: ADR 0251 (decisions 1 and 2).
 */

/** The folder picker's answer. */
export interface PickFolderOutput {
  /** The chosen folder, or null when the dialog was cancelled. */
  readonly path: string | null;
}
