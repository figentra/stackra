/**
 * Stackra file contract:
 * Purpose: `DOCS_SITE_DIR`, where gen assembles a docs app's Mintlify root, relative to the member root. `mint dev`,
 *          `mint validate`, `mint broken-links` and `mint a11y` run there, and runway publishes it.
 * Boundary: a constant; the folder is generated whole and gitignored (`.stackra/*`), never edited.
 * Runtime: isomorphic
 * Governing contract: ADR 0002 (2026-10-27 amendment); ADR 0295 (decision 5: tool files live in `.stackra/`).
 */

/** The generated Mintlify root of a docs app. */
export const DOCS_SITE_DIR = ".stackra/site";
