/**
 * Stackra file contract:
 * Purpose: `ReportEngineDimension`, one declared dimension as an engine reads it: the source path and the grains a
 *          time field may be bucketed by.
 * Boundary: a type only, engine-neutral: grains are their string values (`"month"`), so a core `ReportDimension` is
 *           assignable to it and an engine package needs no core import.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decisions 2 and 8); ADR 0294 (decision 15: the leaf entry).
 */

/** One dimension of a declaration. */
export interface ReportEngineDimension {
  /** The field path (`"status"`, `"customer.country"`). */
  readonly path: string;

  /** The grain values a time field may be bucketed by; absent for a field that is not a time. */
  readonly grains?: readonly string[];
}
