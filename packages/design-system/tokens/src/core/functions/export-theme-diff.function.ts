/**
 * Stackra file contract:
 * Purpose: a theme as its changes-only JSON export (`stackra.theme-diff/2`): the token-set version its paths belong to
 *          (ADR 0340 decision 6), the name of the base it was made from and only the leaves that differ from it, so a
 *          reviewer sees what a brand changed and `parseThemeJson` applies it to that base again, through the path
 *          aliases of any later token set.
 * Boundary: pure; returns a plain object, which the caller turns into text.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the Theme Studio); ADR 0340 (decision 6).
 */
import type { Theme } from "#contracts/types/theme.type";
import { THEME_JSON_FORMATS } from "#core/constants/theme-json-formats.constant";
import { TOKEN_SET_VERSION } from "#core/constants/token-set-version.constant";
import { diffTheme } from "#core/functions/diff-theme.function";

/** The changes-only JSON export of `theme` against `base`. */
export function exportThemeDiff(base: Theme, theme: Theme) {
  return {
    format: THEME_JSON_FORMATS.diff,
    tokenSet: TOKEN_SET_VERSION,
    base: base.name,
    name: theme.name,
    changes: diffTheme(base, theme),
  };
}
