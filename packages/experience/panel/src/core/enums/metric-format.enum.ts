/**
 * Stackra file contract:
 * Purpose: `MetricFormat`, the mark a metric carries on the wire when its number is not a plain count, so a renderer
 *          formats it from the answer alone.
 * Boundary: an enum (`Enum.of`); only `PercentMetric` carries one today (money is told apart by its `currency`).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 15 and 16: metrics computed by the query); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * How a metric's numbers read.
 *
 * @example
 * PercentMetric.from({ current: 0.67, previous: 0.6 }).format // MetricFormat.Percent
 */
export const MetricFormat = Enum.of({
  /** A ratio shown as a percent (0.67 is 67%). */
  Percent: "percent",
});

/** One of the codes above. */
export type MetricFormat = Enum.Value<typeof MetricFormat>;
