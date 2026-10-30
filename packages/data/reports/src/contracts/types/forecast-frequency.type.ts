/**
 * Stackra file contract:
 * Purpose: `ForecastFrequency`, the step between a series' points: `H` hour, `D` day, `W` week, `M` month (starting on
 *          the first).
 * Boundary: a type only; the codes the forecast image reads.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 8); ADR 0294 (decision 15: the leaf entry).
 */

/** One of the steps a forecast runs in. */
export type ForecastFrequency = "H" | "D" | "W" | "M";
