/**
 * Stackra file contract:
 * Purpose: whether a filter's value filters nothing: blank text, a list with no choice, a number or date range with
 *          neither bound. A yes or no is never empty, because "no" is an answer. FilterBar drops the chip of an emptied
 *          filter with it, and `isResourceQueryFiltered` ignores such a value, so an editor left open and cleared does
 *          not count as an applied filter.
 * Boundary: pure; internal, not in the `.` barrel. It tells the kinds apart by the shape of the value, which the
 *           `FilterValueByKind` shapes keep distinct, so it needs no `FilterDefinition`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0318.
 */
import type { FilterValue } from "#contracts/types/filter-value.type";

/**
 * Says whether a filter value filters nothing.
 * @param value - the value of one filter, of any kind
 * @returns true for blank text, an empty list, or a range with no bound; false for a yes or no and anything else set
 */
export function isFilterValueEmpty(value: FilterValue): boolean {
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "boolean") return false;
  if ("min" in value) return value.min === null && value.max === null;
  if ("start" in value) return value.start === null && value.end === null;
  return value.length === 0;
}
