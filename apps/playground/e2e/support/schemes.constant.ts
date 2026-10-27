/**
 * Stackra file contract:
 * Purpose: `SCHEMES`: the colour schemes every suite runs in.
 * Boundary: test support only; data.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0182 (test tiers); ADR 0022 (test placement).
 */

/** The colour schemes every suite runs in. */
export const SCHEMES = ["light", "dark"] as const;
