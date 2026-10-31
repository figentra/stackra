/**
 * Stackra file contract:
 * Purpose: `collectionFilterWith`, the engine's `CollectionFilter` with one quick filter set to a value, or removed when
 *          the value is empty or undefined. The value is written as one top-level condition (`quickFilterIdOf`): text
 *          `contains`, a choice `equals` or `in`, a number or date range `between` (an open end is empty), yes or no
 *          `is_true` / `is_false`. A changed filter keeps its place among the conditions.
 * Boundary: pure; the other conditions and the nested groups stay as they are.
 * Runtime: isomorphic
 * Governing contract: ADR 0505 (one filter model).
 */
import type { CollectionFilter } from "#contracts/types/collection-filter.type";
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { FilterValue } from "#contracts/types/filter-value.type";
import type { RuleCondition } from "#contracts/types/rule-condition.type";
import { isFilterValueEmpty } from "#core/functions/is-filter-value-empty.function";
import { quickFilterIdOf } from "#core/functions/quick-filter-id-of.function";

/** The condition a quick filter's value is written as. */
function conditionOf(definition: FilterDefinition, value: FilterValue): RuleCondition {
  const base = { id: quickFilterIdOf(definition.id), field: definition.id };
  if (typeof value === "boolean")
    return { ...base, operator: value ? "is_true" : "is_false", value: "" };
  if (typeof value === "string")
    return { ...base, operator: definition.kind === "select" ? "equals" : "contains", value };
  if (!("min" in value) && !("start" in value)) return { ...base, operator: "in", value };
  if ("min" in value)
    return {
      ...base,
      operator: "between",
      value: [
        value.min === null ? "" : String(value.min),
        value.max === null ? "" : String(value.max),
      ],
    };
  return {
    ...base,
    operator: "between",
    value: [value.start?.toString() ?? "", value.end?.toString() ?? ""],
  };
}

/**
 * The filter with a quick filter set or removed.
 * @param filter - the engine's filter
 * @param definition - the quick filter
 * @param value - its new value; undefined or empty removes it
 * @returns the next filter
 */
export function collectionFilterWith(
  filter: CollectionFilter,
  definition: FilterDefinition,
  value: FilterValue | undefined,
): CollectionFilter {
  const id = quickFilterIdOf(definition.id);
  const isRemoved = value === undefined || isFilterValueEmpty(value);
  const has = filter.conditions.some((condition) => condition.id === id);
  if (isRemoved)
    return { ...filter, conditions: filter.conditions.filter((condition) => condition.id !== id) };
  const next = conditionOf(definition, value);
  return {
    ...filter,
    conditions: has
      ? filter.conditions.map((condition) => (condition.id === id ? next : condition))
      : [...filter.conditions, next],
  };
}
