/**
 * Stackra file contract:
 * Purpose: `commitSiteTheme(history, theme, change)`, a theme's history with one more revision: the next number, the
 *          theme frozen as given, and its author, time and note.
 * Boundary: pure; never changes `history`, returns a new list. Validating the sections is `validateSiteTheme`'s, before
 *           a commit is offered for publish.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 2: versions); COM-216 to COM-218 (themes with revisions and rollback);
 *                     STA-1383 (renamed SiteTheme so Theme means design tokens).
 */
import type { SiteTheme } from "#core/types/site-theme.type";
import type { SiteThemeChange } from "#core/types/site-theme-change.type";
import type { SiteThemeRevision } from "#core/types/site-theme-revision.type";

/**
 * `history` with `theme` as its newest revision.
 *
 * @example
 * const next = commitSiteTheme(history, draft, { author: "usr_1", at: new Date().toISOString() });
 */
export function commitSiteTheme(
  history: readonly SiteThemeRevision[],
  theme: SiteTheme,
  change: SiteThemeChange,
): readonly SiteThemeRevision[] {
  const number = (history.at(-1)?.number ?? 0) + 1;
  const revision: SiteThemeRevision = Object.freeze({
    number,
    theme: structuredClone(theme),
    author: change.author,
    at: change.at,
    ...(change.note !== undefined && { note: change.note }),
  });
  return Object.freeze([...history, revision]);
}
