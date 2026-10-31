/**
 * Stackra file contract:
 * Purpose: `filterValueOf`, the value a quick filter's editor shows, read from the engine's `CollectionFilter`: its
 *          top-level condition (`quickFilterIdOf`) turned back into the kind's value (text `contains`, a number or date
 *          `between`, a choice `equals` or `in`, yes or no `is_true` / `is_false`).
 * Boundary: pure; a condition of another shape (the advanced editor's) is no value of the filter.
 * Runtime: isomorphic
 * Governing contract: ADR 0505 (one filter model).
 */
import { parseDate, type CalendarDate } from "@internationalized/date";

import type { CollectionFilter } from "#contracts/types/collection-filter.type";
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { FilterValue } from "#contracts/types/filter-value.type";
import { quickFilterIdOf } from "#core/functions/quick-filter-id-of.function";

/** A `[from, to]` pair of a `between` value. */
const pairOf = (value: string | readonly string[]): readonly [string, string] =>
  typeof value === "string" ? [value, ""] : [value[0] ?? "", value[1] ?? ""];

/** An ISO day, or null for an empty or bad one. */
function dayOf(text: string): CalendarDate | null {
  if (text === "") return null;
  try {
    return parseDate(text);
  } catch {
    return null;
  }
}

/** A number, or null for an empty or bad one. */
function numberOf(text: string): number | null {
  const value = text.trim() === "" ? Number.NaN : Number(text);
  return Number.isFinite(value) ? value : null;
}

/**
 * The value of a quick filter.
 * @param filter - the engine's filter
 * @param definition - the quick filter
 * @returns the kind's value, or undefined when the filter is not applied
 */
export function filterValueOf(
  filter: CollectionFilter,
  definition: FilterDefinition,
): FilterValue | undefined {
  const condition = filter.conditions.find((entry) => entry.id === quickFilterIdOf(definition.id));
  if (!condition) return undefined;
  const { operator, value } = condition;
  switch (definition.kind) {
    case "text": {
      return operator === "contains" && typeof value === "string" ? value : undefined;
    }
    case "select": {
      return operator === "equals" && typeof value === "string" ? value : undefined;
    }
    case "multi-select": {
      return operator === "in" ? (typeof value === "string" ? [value] : value) : undefined;
    }
    case "boolean": {
      return operator === "is_true" ? true : operator === "is_false" ? false : undefined;
    }
    case "number": {
      if (operator !== "between") return undefined;
      const [min, max] = pairOf(value);
      return { min: numberOf(min), max: numberOf(max) };
    }
    case "date-range": {
      if (operator !== "between") return undefined;
      const [start, end] = pairOf(value);
      return { start: dayOf(start), end: dayOf(end) };
    }
  }
}
