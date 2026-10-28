/**
 * Stackra file contract:
 * Purpose: `MetricSeries`, a metric per bucket (a day by default) of a period and of the period before it: the
 *          sparkline of a KPI.
 * Boundary: a type only; one number per bucket, zero for a bucket without rows, oldest first. Each period has the
 *           buckets its own window touches in the metric's time zone, so a window that does not start on a bucket
 *           boundary (a custom range, or a previous window shifted by a daylight-saving change) may have one more.
 * Runtime: node
 * Governing contract: ADR 0307 (rules 15 and 16); reporting gap 10.
 */

/** Bucketed values of a metric. */
export interface MetricSeries {
  /** One value per bucket of the period. */
  readonly current: number[];

  /** One value per bucket of the previous period. */
  readonly previous: number[];
}
