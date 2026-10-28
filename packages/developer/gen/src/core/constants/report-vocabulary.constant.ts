/**
 * Stackra file contract:
 * Purpose: `REPORT_VOCABULARY`, the closed sets of ADR 0470 decision 2 that gen holds a `Report` to: the time grains,
 *          the measure kinds (and those that read no field) and the metric classes.
 * Boundary: frozen data, kept in step with `TimeGrain`, `MeasureKind` and `ReportMetric` of `@stackra/reports` (their
 *           exact-set test there). Copied rather than imported, so gen takes no dependency on a data package for
 *           three lists.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 2; Enforcement: gen refuses a measure outside the closed set).
 */

/** The report vocabulary. */
export const REPORT_VOCABULARY: {
  readonly grains: ReadonlySet<string>;
  readonly kinds: ReadonlySet<string>;
  readonly fieldless: ReadonlySet<string>;
  readonly metrics: ReadonlySet<string>;
} = Object.freeze({
  grains: new Set(["hour", "day", "week", "month", "quarter", "year"]),
  kinds: new Set(["count", "countDistinct", "sum", "avg", "min", "max", "formula"]),
  fieldless: new Set(["count", "formula"]),
  metrics: new Set(["count", "number", "money", "percent", "duration"]),
});
