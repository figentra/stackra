/**
 * Stackra file contract:
 * Purpose: `PickFolderInput`, what the renderer sends `PickFolderBridge`: the purpose the folder is picked for
 *          (`receipt_archive`, `exports`), under which main remembers the choice.
 * Boundary: a type only; the bridge re-checks it, because it crosses from the renderer.
 * Runtime: isomorphic
 * Governing contract: ADR 0251 (decisions 1 and 2).
 */

/** The folder picker's input. */
export interface PickFolderInput {
  /** What the folder is for: snake_case. */
  readonly purpose: string;

  /** The dialog's title, already translated by the renderer. */
  readonly title?: string;
}
