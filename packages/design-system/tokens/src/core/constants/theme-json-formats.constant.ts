/**
 * Stackra file contract:
 * Purpose: the `format` marks of the theme JSON files the Theme Studio writes and reads: a full theme
 *          (`stackra.theme/1`, the theme and its HeroUI and Stackra custom properties) and a changes-only diff against a
 *          base (`stackra.theme-diff/1`). The number after the slash moves when a file's shape changes.
 * Boundary: data only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the Theme Studio).
 */

/** The theme JSON formats, by kind. */
export const THEME_JSON_FORMATS = Object.freeze({
  theme: "stackra.theme/1",
  diff: "stackra.theme-diff/1",
} as const);
