/**
 * Stackra file contract:
 * Purpose: `listFiltersOf`, the list query's filter values (by row path) read from a `useCollection` engine's filter:
 *          each quick-filter condition (`@stackra/ui`'s `filterValueOf`) of a filterable column in the filter bar's value
 *          shapes, with the trashed filter's one choice as its `with` or `only` code, and then each condition the
 *          advanced editor added, already in its `TableFilter` wire form: equals and "is any of" as a list, not equals,
 *          greater and less as comparisons, contains, between as a range (a date column's as a day range), before and
 *          after as a comparison with the day, empty and not empty as is-null, yes and no as a boolean. `tableInput`
 *          then turns each quick value into its wire form and passes the wired ones as they are. It also names what it
 *          cannot send (`unsent`), the ids the filter bar draws as warnings (`unappliedIds`).
 * Boundary: pure. The server reads one value per key, all of them together, so a condition is sent only from a filter
 *           that matches all (or holds one condition), only the first on a key, and only for an operator the
 *           `TableFilter` vocabulary has. Everything else is unsent: every condition of an "any" filter of several,
 *           every nested group (by its id, or `group-<index>` as the bar names one without), a second condition on a
 *           key, "does not contain" and "is none of".
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 9); ADR 0505 (one filter model).
 */
import { filterDefinitionsOf, filterValueOf, quickFilterIdOf } from "@stackra/ui";
import type { CollectionColumn, CollectionFilter, RuleCondition } from "@stackra/ui/contracts";

/** What a filter sends: the values by key, and the ids of the conditions and groups it cannot send. */
interface ListFilters {
  readonly values: Readonly<Record<string, unknown>>;
  readonly unsent: readonly string[];
}

/** One day in milliseconds. */
const DAY = 86_400_000;

/** The ISO calendar day after `day` (`YYYY-MM-DD`). */
const nextDay = (day: string): string =>
  new Date(Date.parse(`${day}T00:00:00Z`) + DAY).toISOString().slice(0, 10);

/** The wire value of one advanced condition on `column`, or undefined when the server has no such operator. */
function wireOf(condition: RuleCondition, column: CollectionColumn | undefined): unknown {
  const { operator, value } = condition;
  const isNumber = column?.type === "number";
  const isDate = column?.type === "date";
  const operand = (raw: string | undefined): string | number | undefined => {
    if (raw === undefined || raw === "") return undefined;
    if (!isNumber) return raw;
    const number = Number(raw);
    return Number.isFinite(number) ? number : undefined;
  };
  const list = (typeof value === "string" ? [value] : value).flatMap((raw) => {
    const one = operand(raw);
    return one === undefined ? [] : [one];
  });
  const one = typeof value === "string" ? operand(value) : undefined;
  switch (operator) {
    case "equals":
    case "in": {
      return list.length === 0 ? undefined : list;
    }
    case "not_equals":
    case "greater":
    case "less": {
      const op = operator === "not_equals" ? "ne" : operator === "greater" ? "gt" : "lt";
      return one === undefined ? undefined : { op, value: one };
    }
    case "contains": {
      return typeof one === "string" ? { op: "contains", value: one } : undefined;
    }
    case "between": {
      const [from, to] = typeof value === "string" ? [value] : value;
      const bounds = Object.entries({ from: operand(from), to: operand(to) }).filter(
        ([, bound]) => bound !== undefined,
      );
      if (bounds.length === 0) return undefined;
      return { op: isDate ? "dateRange" : "range", ...Object.fromEntries(bounds) };
    }
    case "before": {
      return typeof one === "string" ? { op: "lt", value: one } : undefined;
    }
    case "after": {
      // After a day is from the next one: the column holds instants, the condition a calendar day.
      return typeof one === "string"
        ? { op: "gte", value: isDate ? nextDay(one) : one }
        : undefined;
    }
    case "is_empty":
    case "is_not_empty": {
      return { op: "isNull", value: operator === "is_empty" };
    }
    case "is_true":
    case "is_false": {
      return operator === "is_true";
    }
    default: {
      return undefined;
    }
  }
}

/**
 * The filter values of `filter` over `columns`, and what it cannot send.
 *
 * @example
 * listFiltersOf(collection.state.filter, columns);
 * // { values: { status: ["paid"], total: { min: 10, max: null } }, unsent: [] }
 */
export function listFiltersOf(
  filter: CollectionFilter,
  columns: readonly CollectionColumn[],
): ListFilters {
  const groups = (filter.groups ?? []).map((group, index) => group.id ?? `group-${index}`);
  if (filter.match === "any" && filter.conditions.length > 1)
    return { values: {}, unsent: [...filter.conditions.map((entry) => entry.id), ...groups] };
  const values: Record<string, unknown> = Object.fromEntries(
    filterDefinitionsOf(columns).flatMap((definition) => {
      const value = filterValueOf(filter, definition);
      if (value === undefined) return [];
      return [
        [definition.id, definition.id === "trashed" && Array.isArray(value) ? value[0] : value],
      ];
    }),
  );
  const unsent: string[] = [];
  const quickIds = new Set(Object.keys(values).map(quickFilterIdOf));
  for (const condition of filter.conditions) {
    if (quickIds.has(condition.id)) continue;
    const column = columns.find((entry) => entry.id === condition.field);
    if (
      Object.hasOwn(values, condition.field) ||
      condition.field === "trashed" ||
      column?.isFilterable === false
    ) {
      unsent.push(condition.id);
      continue;
    }
    const wire = wireOf(condition, column);
    if (wire === undefined) unsent.push(condition.id);
    else values[condition.field] = wire;
  }
  return { values, unsent: [...unsent, ...groups] };
}
