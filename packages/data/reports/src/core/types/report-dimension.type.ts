/**
 * Stackra file contract:
 * Purpose: `ReportDimension<S>`, one dimension a report may be grouped, filtered and pivoted by: a field path of the
 *          source, for a time field the grains it may be bucketed by, and who may see it (a permission and a data
 *          class).
 * Boundary: a type only; `Report({ dimensions })` checks it and gen records it in the manifest's `reports` section.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 2: dimensions; decision 6: columns carry visibility); ADR 0341.
 */
import type { TimeGrain } from "#core/enums/time-grain.enum";
import type { ReportPath } from "#core/types/report-path.type";

/** One declared dimension. */
export interface ReportDimension<S = Record<string, unknown>> {
  /** The field path (`"status"`, `"customer.country"`). */
  readonly path: ReportPath<S>;

  /** The grains a time field may be bucketed by; absent for a field that is not a time. */
  readonly grains?: readonly TimeGrain[];

  /** A `Permissions` static (or its key) a caller holds to see this column; gen records its key. */
  readonly permission?: unknown;

  /** The data class the column holds (`DataClassification` code or a product class key); hidden unless a permission opts it in. */
  readonly dataClass?: string;
}
