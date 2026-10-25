/**
 * Stackra file contract:
 * Purpose: a theme as its changes-only JSON export (`stackra.theme-diff/1`): the name of the base it was made from
 *          and only the leaves that differ from it, so a reviewer sees what a brand changed and `parseThemeJson`
 *          applies it to that base again.
 * Boundary: pure; returns a plain object, which the caller turns into text.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the Theme Studio).
 */
import type { Theme } from "#contracts/types/theme.type";
import { THEME_JSON_FORMATS } from "#core/constants/theme-json-formats.constant";
import { diffTheme } from "#core/functions/diff-theme.function";

/** The changes-only JSON export of `theme` against `base`. */
export function exportThemeDiff(base: Theme, theme: Theme) {
  return {
    format: THEME_JSON_FORMATS.diff,
    base: base.name,
    name: theme.name,
    changes: diffTheme(base, theme),
  };
}
