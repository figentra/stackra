/**
 * Stackra file contract:
 * Purpose: the alias map of renamed theme paths (ADR 0340 decision 6): each old path, as a stored diff may name it, and
 *          the current path it moved to. `aliasThemeDiff` rewrites a diff through it, and `resolveTheme` and the
 *          import apply it before they check or merge, so a rename never refuses a stored brand or breaks the resolve
 *          endpoint. The path-stability test refuses a published path that is gone without an alias here.
 * Boundary: data only. A key is never a live path again, and a value is always a live path.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decisions 6 and 8).
 */

/** Old theme path to current theme path, token by token. */
export const TOKEN_PATH_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  // Token set 1: the mark's amber bar took a neutral name (decision 8).
  "palette.cursor": "palette.amber-strong",
});
