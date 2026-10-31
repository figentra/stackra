/**
 * Stackra file contract:
 * Purpose: proves the one filter model: quick filters derived from the column types, each kind's value written to a
 *          top-level condition of a `CollectionFilter` and read back, an empty value removing it, the chip text of any
 *          condition, the operators each type offers, and `ruleMatches` on the operators added for FilterBar and
 *          FilterPanel (in, not in, between, before, after, yes, no).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0505 (one filter model); ADR 0022 (test placement); STA-1371.
 */
import { parseDate } from "@internationalized/date";
import { describe, expect, it } from "vitest";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionFilter } from "#contracts/types/collection-filter.type";
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import { collectionFilterWith } from "#core/functions/collection-filter-with.function";
import { conditionChipTextOf } from "#core/functions/condition-chip-text-of.function";
import { filterDefinitionsOf } from "#core/functions/filter-definitions-of.function";
import { filterValueOf } from "#core/functions/filter-value-of.function";
import { ruleMatches } from "#core/functions/rule-matches.function";
import { ruleOperatorsOf } from "#core/functions/rule-operators-of.function";

const columns: readonly CollectionColumn[] = [
  { id: "name", label: "Name" },
  { id: "total", label: "Total", type: "number", min: 0 },
  {
    id: "status",
    label: "Status",
    type: "choice",
    options: [
      { id: "paid", label: "Paid" },
      { id: "sent", label: "Sent" },
    ],
  },
  { id: "due", label: "Due", type: "date" },
  { id: "isRush", label: "Rush", type: "boolean" },
  { id: "note", label: "Note", isFilterable: false },
];
const EMPTY: CollectionFilter = { match: "all", conditions: [] };
/** The quick filter of a column. */
function quick(id: string): FilterDefinition {
  const found = filterDefinitionsOf(columns).find((entry) => entry.id === id);
  if (!found) throw new Error(`no filter ${id}`);
  return found;
}
const [name, total, status, due, rush] = ["name", "total", "status", "due", "isRush"].map(
  quick,
) as [FilterDefinition, FilterDefinition, FilterDefinition, FilterDefinition, FilterDefinition];

describe("filterDefinitionsOf", () => {
  it("derives one quick filter per filterable column, the kind from the type", () => {
    expect(filterDefinitionsOf(columns).map((entry) => entry.kind)).toEqual([
      "text",
      "number",
      "multi-select",
      "date-range",
      "boolean",
    ]);
    expect(total).toMatchObject({ minValue: 0 });
  });

  it("carries the column's filter settings to the editor of its kind, and drops the rest", () => {
    const [text, money, flag] = filterDefinitionsOf([
      { id: "name", label: "Name", filter: { placeholder: "Acme", step: 5, isDisabled: true } },
      {
        id: "total",
        label: "Total",
        type: "number",
        filter: { step: 0.5, formatOptions: { style: "currency", currency: "SAR" } },
      },
      {
        id: "isRush",
        label: "Rush",
        type: "boolean",
        filter: { trueLabel: "Rush", falseLabel: "Standard" },
      },
    ]);
    expect(text).toEqual({
      id: "name",
      label: "Name",
      kind: "text",
      placeholder: "Acme",
      isDisabled: true,
    });
    expect(money).toEqual({
      id: "total",
      label: "Total",
      kind: "number",
      step: 0.5,
      formatOptions: { style: "currency", currency: "SAR" },
    });
    expect(flag).toEqual({
      id: "isRush",
      label: "Rush",
      kind: "boolean",
      trueLabel: "Rush",
      falseLabel: "Standard",
    });
  });
});

describe("collectionFilterWith and filterValueOf", () => {
  it("writes each kind as one condition and reads it back", () => {
    const range = { start: parseDate("2026-01-01"), end: null };
    let filter = EMPTY;
    filter = collectionFilterWith(filter, name, "acme");
    filter = collectionFilterWith(filter, total, { min: 10, max: null });
    filter = collectionFilterWith(filter, status, ["paid"]);
    filter = collectionFilterWith(filter, due, range);
    filter = collectionFilterWith(filter, rush, false);
    expect(filter.conditions.map((entry) => entry.operator)).toEqual([
      "contains",
      "between",
      "in",
      "between",
      "is_false",
    ]);
    expect(filterValueOf(filter, name)).toBe("acme");
    expect(filterValueOf(filter, total)).toEqual({ min: 10, max: null });
    expect(filterValueOf(filter, status)).toEqual(["paid"]);
    expect(filterValueOf(filter, due)).toEqual(range);
    expect(filterValueOf(filter, rush)).toBe(false);
  });

  it("keeps a changed filter's place and removes an empty one", () => {
    let filter = collectionFilterWith(EMPTY, name, "a");
    filter = collectionFilterWith(filter, status, ["paid"]);
    filter = collectionFilterWith(filter, name, "b");
    expect(filter.conditions.map((entry) => entry.field)).toEqual(["name", "status"]);
    filter = collectionFilterWith(filter, status, []);
    filter = collectionFilterWith(filter, name, undefined);
    expect(filter.conditions).toEqual([]);
  });

  it("reads no value from a condition of another shape", () => {
    const filter: CollectionFilter = {
      match: "all",
      conditions: [{ id: "filter:name", field: "name", operator: "equals", value: "x" }],
    };
    expect(filterValueOf(filter, name)).toBeUndefined();
  });
});

/** An operator's word: its key with a space. */
const word = (operator: string) => operator.replace("_", " ");

describe("conditionChipTextOf", () => {
  it("names the column, the operator and the value", () => {
    expect(
      conditionChipTextOf(
        { id: "1", field: "status", operator: "in", value: ["paid", "sent"] },
        columns,
        word,
      ),
    ).toBe("Status in Paid, Sent");
    expect(
      conditionChipTextOf(
        { id: "2", field: "total", operator: "between", value: ["1", "9"] },
        columns,
        word,
      ),
    ).toBe("Total between 1 – 9");
    expect(
      conditionChipTextOf(
        { id: "3", field: "isRush", operator: "is_true", value: "" },
        columns,
        word,
      ),
    ).toBe("Rush is true");
  });
});

/** Whether one condition on `f` holds for `actual`. */
const match = (operator: string, value: string | readonly string[], actual: unknown) =>
  ruleMatches(
    { match: "all", conditions: [{ id: "c", field: "f", operator: operator as never, value }] },
    { f: actual },
  );

describe("ruleOperatorsOf and ruleMatches", () => {
  it("offers yes or no for a boolean and a range for a date", () => {
    expect(ruleOperatorsOf("boolean")).toEqual(["is_true", "is_false"]);
    expect(ruleOperatorsOf("date")).toContain("between");
  });

  it("tests a list, a range, a day and a flag", () => {
    expect(match("in", ["Paid", "sent"], "paid")).toBe(true);
    expect(match("not_in", ["paid"], "sent")).toBe(true);
    expect(match("not_in", ["paid"], null)).toBe(true);
    expect(match("between", ["10", ""], 12)).toBe(true);
    expect(match("between", ["10", "11"], 12)).toBe(false);
    expect(match("between", ["2026-01-01", "2026-01-31"], "2026-01-31T10:00:00Z")).toBe(true);
    expect(match("before", "2026-01-01", "2025-12-31")).toBe(true);
    expect(match("after", "2026-01-01", "2026-01-01")).toBe(false);
    expect(match("is_true", "", "true")).toBe(true);
    expect(match("is_false", "", null)).toBe(true);
    expect(match("equals", "5", 5)).toBe(true);
  });
});
