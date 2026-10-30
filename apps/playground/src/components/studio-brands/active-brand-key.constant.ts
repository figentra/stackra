/**
 * Stackra file contract:
 * Purpose: `ACTIVE_BRAND_KEY`: the localStorage key the brand picked in the Theme Studio lives under.
 * Boundary: data only.
 * Runtime: browser
 * Governing contract: ADR 0340 (decision 2).
 */

/** The localStorage key the picked brand's id lives under. */
export const ACTIVE_BRAND_KEY = "stackra-playground:brand";
