/**
 * Stackra file contract:
 * Purpose: `DEFAULT_MONTHLY_LIMITS`, the plan's monthly estimate cap in US dollars for an environment whose runway sets
 *          no `limits.monthly`: $150 in dev, $500 in staging. Preview and production have none, so their plans only
 *          warn until the owner sets a number (owner, 2026-10-30).
 * Boundary: data only; `runtimePlan` reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decision 3, owner answer Q4).
 */

/** Default caps by environment. */
export const DEFAULT_MONTHLY_LIMITS: Readonly<Record<string, number>> = Object.freeze({
  dev: 150,
  staging: 500,
});
