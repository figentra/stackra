/**
 * Stackra file contract:
 * Purpose: `ReportDimension<S>`, one dimension a report may be grouped, filtered and pivoted by: a field path of the
 *          source and, for a time field, the grains it may be bucketed by.
 * Boundary: a type only; `Report({ dimensions })` checks it and gen records it in the manifest's `reports` section.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 2: dimensions).
 */
import type { TimeGrain } from "#core/enums/time-grain.enum";
import type { ReportPath } from "#core/types/report-path.type";

/** One declared dimension. */
export interface ReportDimension<S = Record<string, unknown>> {
  /** The field path (`"status"`, `"customer.country"`). */
  readonly path: ReportPath<S>;

  /** The grains a time field may be bucketed by; absent for a field that is not a time. */
  readonly grains?: readonly TimeGrain[];
}
