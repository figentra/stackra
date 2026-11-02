/**
 * Stackra file contract:
 * Purpose: `SUFFIX_KINDS`: the kinds named `<scope>/<name>-<kind>` (`@figentra/billing-contract`,
 *          `@figentra/billing-docs`); every other non-package kind is named `<scope>/<kind>-<name>`.
 * Boundary: a constant only.
 * Runtime: worker
 * Governing contract: ADR 0511 (contract); ADR 0514 (decision 10, docs).
 */

/** The kinds named with a `-<kind>` suffix. */
export const SUFFIX_KINDS: readonly string[] = ["contract", "docs"];
