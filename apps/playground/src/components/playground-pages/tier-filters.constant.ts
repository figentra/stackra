/**
 * Stackra file contract:
 * Purpose: `TIER_FILTERS`: the values of the navigation's tier filter, in the order the control shows them.
 * Boundary: one frozen tuple, in its own file.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); ADR 0305 (rule 10).
 */

/** The values of the navigation's tier filter, in the order the control shows them. */
export const TIER_FILTERS = Object.freeze(["all", "free", "pro"] as const);
