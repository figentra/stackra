/**
 * Stackra file contract:
 * Purpose: `DOCS_LINT_BUILD_DIR`, the folder of a Fumadocs docs site that `stackra lint` builds into for its link
 *          check, apart from `build/`, so a `build` and a `lint` that turbo runs side by side never empty each other's
 *          output (Pay's docs build failed on a server asset the other run had just removed).
 * Boundary: data only; a dot folder, so gen's pruning of `.stackra/site/` leaves it alone. Passed to the generated
 *           `react-router.config.ts` as `STACKRA_DOCS_BUILD_DIR`.
 * Runtime: node
 * Governing contract: ADR 0514; STA-2026 (FR-005: the link check reads a build).
 */

/** Where `stackra lint` builds a Fumadocs site, relative to the site. */
export const DOCS_LINT_BUILD_DIR = ".lint-build";
