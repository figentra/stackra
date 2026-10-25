/**
 * Stackra file contract:
 * Purpose: `MetricValue`, an aggregate over a period and the period before it, as `CrudService.metrics()` returns it:
 *          what `CountMetric.from` and `MoneyMetric.from` read.
 * Boundary: a type only, written structurally so this package does not depend on `@stackra/database`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 16: the query computes current and previous values).
 */

/** A current and a previous value. */
export interface MetricValue {
  /** The value over the period. */
  readonly current: number;

  /** The value over the period of the same length just before it. */
  readonly previous: number;
}
