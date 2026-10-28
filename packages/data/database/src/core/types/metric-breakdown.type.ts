/**
 * Stackra file contract:
 * Purpose: `MetricBreakdown`, one group of a metric split by a dimension (`paid.breakdown("channel", Aggregate.Sum,
 *          "total.minor")`): the dimension's value and the metric over the period and the period before it.
 * Boundary: a type only; the groups come from one statement, largest current value first.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 16); reporting gap 10.
 */

/** A metric for one value of a dimension. */
export interface MetricBreakdown {
  /** The dimension's value; `null` groups the rows without one. */
  readonly key: string | number | boolean | null;

  /** The value over the period. */
  readonly current: number;

  /** The value over the previous period. */
  readonly previous: number;
}
