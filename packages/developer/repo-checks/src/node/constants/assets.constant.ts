/**
 * Stackra file contract:
 * Purpose: `ASSETS`, where static files shipped with a module live: `assets/` at the package root, not under `src/`.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0177; ADR 0234 (decision 2).
 */

/**
 * Static files shipped with a module live in `assets/` at the package root, not under `src/` (ADR 0177, ADR 0234 d2).
 * `lang` feeds the i18n registry; the other folders carry their own rules in ADR 0234.
 */
export const ASSETS = Object.freeze({
  location: "assets/ at the package root",
  folders: Object.freeze(["public", "lang", "templates", "stubs", "data"]),
  test: null,
  reason: "static files shipped with a module; the word resource is reserved for @Resource",
  adr: "0234",
});
