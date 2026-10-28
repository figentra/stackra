/**
 * Stackra file contract:
 * Purpose: `rollbackSiteTheme(history, to, change)`, a theme's history rolled back to revision `to`: a new revision whose
 *          theme is that revision's, marked with the revision it restores.
 * Boundary: pure; never removes or edits a revision, so the rollback itself can be rolled back.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 8: rollback re-applies a snapshot as a new change); COM-216 to COM-218;
 *                     STA-1383 (renamed SiteTheme so Theme means design tokens).
 */
import { commitSiteTheme } from "#core/functions/commit-site-theme.function";
import type { SiteThemeChange } from "#core/types/site-theme-change.type";
import type { SiteThemeRevision } from "#core/types/site-theme-revision.type";

/**
 * `history` with revision `to` restored as its newest revision.
 *
 * @throws RangeError when `history` has no revision `to`.
 * @example
 * const next = rollbackSiteTheme(history, 3, { author: "usr_1", at: now, note: "undo the holiday header" });
 */
export function rollbackSiteTheme(
  history: readonly SiteThemeRevision[],
  to: number,
  change: SiteThemeChange,
): readonly SiteThemeRevision[] {
  const target = history.find((revision) => revision.number === to);
  if (target === undefined) throw new RangeError(`rollbackSiteTheme: there is no revision ${to}`);
  const next = commitSiteTheme(history, target.theme, change);
  const added = next.at(-1) as SiteThemeRevision;
  return Object.freeze([...history, Object.freeze({ ...added, restores: to })]);
}
