/**
 * Stackra file contract:
 * Purpose: reads a filter's value as the type its kind promises, or `undefined` when the filter is not set or the
 *          value does not have the shape of the kind. A `FilterState` is keyed by `id` alone, and a URL codec may hand
 *          back text for a number filter, so an editor reads through this and shows an empty editor rather than
 *          crashing on a wrong shape.
 * Boundary: pure; internal, not in the `.` barrel. It checks the shape only (text and choice are strings, a yes or no is
 *           a boolean, a list is an array, a range is an object with `min` or with `start`), never the bounds.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (decision 3).
 */
import type { FilterKind } from "#contracts/enums/filter-kind.enum";
import type { FilterValue } from "#contracts/types/filter-value.type";
import type { FilterValueByKind } from "#contracts/types/filter-value-by-kind.type";

/** Says whether `value` has the shape of a value of `kind`. */
function hasShapeOf(kind: FilterKind, value: unknown): boolean {
  switch (kind) {
    case "text":
    case "select":
      return typeof value === "string";
    case "boolean":
      return typeof value === "boolean";
    case "multi-select":
      return Array.isArray(value);
    case "number":
      return typeof value === "object" && value !== null && "min" in value && "max" in value;
    case "date-range":
      return typeof value === "object" && value !== null && "start" in value && "end" in value;
  }
}

/**
 * Reads a filter value as its kind's type.
 * @param kind - the kind of the filter the value belongs to
 * @param value - what the query holds under the filter's `id`, or `undefined` when it holds nothing
 * @returns the value when it has the shape of `kind`, otherwise `undefined`
 */
export function filterValueOfKind<TKind extends FilterKind>(
  kind: TKind,
  value: FilterValue | undefined,
): FilterValueByKind[TKind] | undefined {
  // The one cast: `hasShapeOf` has just checked the shape the type promises.
  return hasShapeOf(kind, value) ? (value as FilterValueByKind[TKind]) : undefined;
}
