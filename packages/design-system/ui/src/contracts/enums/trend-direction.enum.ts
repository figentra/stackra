/**
 * Stackra file contract:
 * Purpose: `TrendDirection`, which way a metric is better: `up` (revenue) or `down` (refunds, wait time).
 * Boundary: values only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decision 15: the display adds the better direction); ADR 0305.
 */

/** The direction in which a metric improves. */
export const TrendDirection = Object.freeze(["up", "down"] as const);

/** One trend direction. */
export type TrendDirection = (typeof TrendDirection)[number];
