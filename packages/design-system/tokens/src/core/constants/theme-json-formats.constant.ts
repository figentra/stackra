/**
 * Stackra file contract:
 * Purpose: the `format` marks of the theme JSON files the Theme Studio writes and reads: a full theme
 *          (`stackra.theme/1`, the theme and its HeroUI and Stackra custom properties) and a changes-only diff against a
 *          base (`stackra.theme-diff/2`, which also carries the token-set version, ADR 0340 decision 6). The number
 *          after the slash moves when a file's shape changes; `parseThemeJson` still reads `stackra.theme-diff/1`.
 * Boundary: data only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the Theme Studio); ADR 0340 (decision 6).
 */

/** The theme JSON formats, by kind: the ones written now. */
export const THEME_JSON_FORMATS = Object.freeze({
  theme: "stackra.theme/1",
  diff: "stackra.theme-diff/2",
  document: "stackra.theme-document/1",
} as const);
