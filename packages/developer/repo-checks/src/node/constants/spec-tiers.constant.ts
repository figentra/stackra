/**
 * Stackra file contract:
 * Purpose: `SPEC_TIERS`, the four sizes a change takes, smallest first: `trivial` (no spec), `small` (a lite spec with
 *          its plan and tasks), `feature` (spec, plan, tasks; one approval stop) and `big` (questionnaire, ADR, spec,
 *          plan, tasks; two approval stops).
 * Boundary: data only; the order is the comparison order.
 * Runtime: node
 * Governing contract: ADR 0502 (spec tiers and approval stops); ADR 0120; ADR 0362. Loaded by plain Node from source
 *                     by core's `tools/scripts` wrappers, so it imports values by relative `.ts` paths and uses
 *                     erasable TypeScript only (ADR 0421 decision 2).
 */

/** The spec tiers, smallest first. */
export const SPEC_TIERS: readonly string[] = ["trivial", "small", "feature", "big"];
