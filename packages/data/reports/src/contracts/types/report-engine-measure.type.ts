/**
 * Stackra file contract:
 * Purpose: `ReportEngineMeasure`, one declared measure as an engine reads it: its kind, the field it reads, its formula
 *          and its metric.
 * Boundary: a type only, engine-neutral: kind and metric are the string values of `MeasureKind` and `ReportMetric`, so
 *           a core `ReportMeasure` is assignable to it. The kind set stays closed (ADR 0470 decision 2): an engine
 *           refuses a kind it does not know rather than guessing.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decisions 2 and 8); ADR 0294 (decision 15: the leaf entry).
 */

/** One measure of a declaration. */
export interface ReportEngineMeasure {
  /** `count`, `countDistinct`, `sum`, `avg`, `min`, `max` or `formula`. */
  readonly kind: string;

  /** The field path it reads; absent for `count` and `formula`. */
  readonly field?: string;

  /** `formula` only: arithmetic over other measure names (`"paid / orders"`). */
  readonly formula?: string;

  /** `count`, `number`, `money`, `percent` or `duration`; `money` keeps the mixed-currency guard. */
  readonly metric: string;
}
