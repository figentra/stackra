/**
 * Stackra file contract:
 * Purpose: `DateRangeFilterDefinition`: a filter on a range of calendar days.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0318.
 */
import type { CalendarDate } from "@internationalized/date";
import type { FilterDefinitionBase } from "#contracts/types/filter-definition-base.type";

/** A filter on a range of calendar days. */
export interface DateRangeFilterDefinition extends FilterDefinitionBase<"date-range"> {
  /** The earliest day the editor accepts. */
  readonly minValue?: CalendarDate | undefined;
  /** The latest day the editor accepts. */
  readonly maxValue?: CalendarDate | undefined;
}
