/**
 * Stackra file contract:
 * Purpose: `MetricSeries`, a metric per day of a period and of the period before it: the sparkline of a KPI.
 * Boundary: a type only; one number per day, zero for a day without rows, oldest first.
 * Runtime: node
 * Governing contract: ADR 0307 (rules 15 and 16).
 */

/** Daily buckets of a metric. */
export interface MetricSeries {
  /** One value per day of the period. */
  readonly current: number[];

  /** One value per day of the previous period. */
  readonly previous: number[];
}
