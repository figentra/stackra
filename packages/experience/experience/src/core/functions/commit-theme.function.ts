/**
 * Stackra file contract:
 * Purpose: `commitTheme(history, theme, change)`, a theme's history with one more revision: the next number, the
 *          theme frozen as given, and its author, time and note.
 * Boundary: pure; never changes `history`, returns a new list. Validating the sections is `validateTheme`'s, before
 *           a commit is offered for publish.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 2: versions); COM-216 to COM-218 (themes with revisions and rollback).
 */
import type { Theme } from "#core/types/theme.type";
import type { ThemeChange } from "#core/types/theme-change.type";
import type { ThemeRevision } from "#core/types/theme-revision.type";

/**
 * `history` with `theme` as its newest revision.
 *
 * @example
 * const next = commitTheme(history, draft, { author: "usr_1", at: new Date().toISOString() });
 */
export function commitTheme(
  history: readonly ThemeRevision[],
  theme: Theme,
  change: ThemeChange,
): readonly ThemeRevision[] {
  const number = (history.at(-1)?.number ?? 0) + 1;
  const revision: ThemeRevision = Object.freeze({
    number,
    theme: structuredClone(theme),
    author: change.author,
    at: change.at,
    ...(change.note !== undefined && { note: change.note }),
  });
  return Object.freeze([...history, revision]);
}
