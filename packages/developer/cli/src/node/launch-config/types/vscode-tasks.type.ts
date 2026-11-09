/**
 * Stackra file contract:
 * Purpose: `VscodeTasks`, a rendered `.vscode/tasks.json`: its leading comment lines and its document.
 * Boundary: type only; `renderVscodeTasks` builds it.
 * Runtime: node
 * Governing contract: STA-2081.
 */

/** A tasks file as gen writes it. */
export type VscodeTasks = {
  /** The comment lines the file opens with, kept as written. */
  readonly header: readonly string[];

  /** The JSON document: the hand-written keys and tasks, then the `dev: …` tasks. */
  readonly document: Record<string, unknown> & { readonly tasks: readonly unknown[] };
};
