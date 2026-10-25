/**
 * Stackra file contract:
 * Purpose: `MetricValue`, a metric over a period and over the period of the same length before it, which a panel
 *          metric class (`MoneyMetric`, `CountMetric`) turns into a value and a trend.
 * Boundary: a type only; both numbers come from one statement.
 * Runtime: node
 * Governing contract: ADR 0307 (rules 15 and 16).
 */

/** A metric and its previous period. */
export interface MetricValue {
  /** The value over the period. */
  readonly current: number;

  /** The value over the previous period. */
  readonly previous: number;
}
