/**
 * Stackra file contract:
 * Purpose: `FEATURE_KINDS`, the kinds of `stackra new` that add a piece of a feature inside a service, not a member:
 *          `module`, `model`, `migration`, `action` and `query`.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3: `stackra new` runs every scaffold); ADR 0294 (the v3 groups).
 */

/** The feature kinds, in the order a feature is usually built. */
export const FEATURE_KINDS: readonly string[] = Object.freeze([
  "module",
  "model",
  "migration",
  "action",
  "query",
]);
