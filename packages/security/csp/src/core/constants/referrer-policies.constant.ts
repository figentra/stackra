/**
 * Stackra file contract:
 * Purpose: `REFERRER_POLICIES`, the `Referrer-Policy` values a host may choose: every standard value that never sends
 *          a full URL to another origin over a downgrade or in the clear.
 * Boundary: `unsafe-url` and `no-referrer-when-downgrade` are left out on purpose, so a configuration cannot loosen the
 *           header below the baseline. Internal: the schema and the options class read it.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); owner round 3 #34.
 */

/** The allowed referrer policies, strictest first. */
export const REFERRER_POLICIES = Object.freeze([
  "no-referrer",
  "same-origin",
  "strict-origin",
  "strict-origin-when-cross-origin",
  "origin",
  "origin-when-cross-origin",
] as const);
