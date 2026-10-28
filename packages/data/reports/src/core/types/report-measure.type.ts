/**
 * Stackra file contract:
 * Purpose: `ReportMeasure<S>`, one measure a report may compute per group: its kind, the field it reads (none for
 *          `count` and `formula`), the formula over other measures (`formula` only) and its metric class.
 * Boundary: a type only; `Report({ measures })` checks it (a field where the kind needs one, a formula in the closed
 *           grammar naming declared measures, money only on sum, avg, min and max) and gen records it.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 2: measures).
 */
import type { MeasureKind } from "#core/enums/measure-kind.enum";
import type { ReportMetric } from "#core/enums/report-metric.enum";
import type { ReportPath } from "#core/types/report-path.type";

/** One declared measure. */
export interface ReportMeasure<S = Record<string, unknown>> {
  /** How the group's rows become one value. */
  readonly kind: MeasureKind;

  /** The field path it reads; required except for `count` and `formula`, which take none. */
  readonly field?: ReportPath<S>;

  /** `formula` only: arithmetic (`+ - * /`, parentheses, numbers) over other measure names (`"paid / orders"`). */
  readonly formula?: string;

  /** The metric class a display formats it as. */
  readonly metric: ReportMetric;
}
