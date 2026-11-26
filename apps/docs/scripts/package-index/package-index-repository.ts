/**
 * Stackra file contract:
 * Purpose: `PACKAGE_INDEX_REPOSITORY`, the GitHub repository the package index links each README and CHANGELOG under.
 * Boundary: one constant; the Stackra repositories moved from the figentra organisation to stackra-inc on 2026-11-26.
 * Runtime: node
 * Governing contract: ADR 0453; STA-2847.
 */

/** The GitHub repository the README and CHANGELOG links point at. */
export const PACKAGE_INDEX_REPOSITORY = "https://github.com/stackra-inc/stackra";
