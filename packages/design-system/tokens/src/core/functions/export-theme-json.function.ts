/**
 * Stackra file contract:
 * Purpose: a theme as its full JSON export (`stackra.theme/1`). The file carries the theme itself, which
 *          `parseThemeJson` reads back and `defineTheme` checks, and its web custom properties split into HeroUI's own
 *          and Stackra's additions, so a reader without @stackra/tokens sees both.
 * Boundary: pure; returns a plain object, which the caller turns into text.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the Theme Studio).
 */
import type { Theme } from "#contracts/types/theme.type";
import { THEME_JSON_FORMATS } from "#core/constants/theme-json-formats.constant";
import { themeVariables } from "#core/functions/theme-variables.function";

/** The full JSON export of `theme`. */
export function exportThemeJson(theme: Theme) {
  return {
    format: THEME_JSON_FORMATS.theme,
    name: theme.name,
    theme,
    variables: themeVariables(theme),
  };
}
