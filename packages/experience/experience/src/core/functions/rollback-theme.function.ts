/**
 * Stackra file contract:
 * Purpose: `rollbackTheme(history, to, change)`, a theme's history rolled back to revision `to`: a new revision whose
 *          theme is that revision's, marked with the revision it restores.
 * Boundary: pure; never removes or edits a revision, so the rollback itself can be rolled back.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 8: rollback re-applies a snapshot as a new change); COM-216 to COM-218.
 */
import { commitTheme } from "#core/functions/commit-theme.function";
import type { ThemeChange } from "#core/types/theme-change.type";
import type { ThemeRevision } from "#core/types/theme-revision.type";

/**
 * `history` with revision `to` restored as its newest revision.
 *
 * @throws RangeError when `history` has no revision `to`.
 * @example
 * const next = rollbackTheme(history, 3, { author: "usr_1", at: now, note: "undo the holiday header" });
 */
export function rollbackTheme(
  history: readonly ThemeRevision[],
  to: number,
  change: ThemeChange,
): readonly ThemeRevision[] {
  const target = history.find((revision) => revision.number === to);
  if (target === undefined) throw new RangeError(`rollbackTheme: there is no revision ${to}`);
  const next = commitTheme(history, target.theme, change);
  const added = next.at(-1) as ThemeRevision;
  return Object.freeze([...history, Object.freeze({ ...added, restores: to })]);
}
