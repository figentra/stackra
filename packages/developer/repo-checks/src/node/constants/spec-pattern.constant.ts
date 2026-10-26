/**
 * Stackra file contract:
 * Purpose: `SPEC_PATTERN`, a `.spec.` file name, which ADR 0022 never uses (tests are `.test`).
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0022.
 */

/** A `.spec.` file: ADR 0022 uses `.test`, never `.spec`. */
export const SPEC_PATTERN = /\.spec\./;
