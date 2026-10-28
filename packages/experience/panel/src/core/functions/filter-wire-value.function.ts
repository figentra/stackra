/**
 * Stackra file contract:
 * Purpose: `filterWireValue(node, value)`, the wire form of one drawn filter value for its node's kind, the
 *          `TableFilter` `CrudService.table` reads: a range `{ min, max }` becomes `{ op: "range", from, to }`, a date
 *          range `{ start, end }` (calendar days) or a `TimeRange` code becomes `{ op: "dateRange", ... }`, a comparison
 *          `{ op: <operator>, value }`, contains `{ op: "contains", value }` and is-null `{ op: "isNull", value }`.
 * Boundary: internal; pure. A value already in wire form (an object with `op`, as a saved view stores it) passes as is;
 *           an empty value (no bound, blank text) is `undefined`, so the filter is not sent. A value or principal filter
 *           passes its value unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2: the closed table input); reporting gap 5.
 */
import type { FilterNode } from "#core/types/filter-node.type";

/** A field filter node. */
type FieldFilter = Exclude<FilterNode, { readonly kind: "trashed" }>;

/** `value` as a present bound, or undefined for null or absent. */
const present = (value: unknown): unknown => (value === null ? undefined : value);

/** A calendar day bound as its `YYYY-MM-DD` text, or undefined for null or absent. */
const day = (bound: unknown): unknown =>
  bound === null || bound === undefined ? undefined : String(bound);

/** An object holding only the bounds that are set, or undefined when none is. */
function bounds(op: string, entries: Readonly<Record<string, unknown>>): unknown {
  const set = Object.entries(entries).filter(([, bound]) => bound !== undefined);
  return set.length === 0 ? undefined : { op, ...Object.fromEntries(set) };
}

/**
 * The wire value of `value` under `node`.
 *
 * @example
 * filterWireValue({ kind: "range", key: "total" }, { min: 10, max: null }); // { op: "range", from: 10 }
 * filterWireValue({ kind: "dateRange", key: "createdAt" }, "last_7_days"); // { op: "dateRange", range: "last_7_days" }
 */
export function filterWireValue(node: FieldFilter, value: unknown): unknown {
  if (typeof value === "object" && value !== null && "op" in value) return value;
  const record = (typeof value === "object" && value !== null ? value : {}) as Readonly<
    Record<string, unknown>
  >;
  const text = typeof value === "string" ? value.trim() : undefined;
  switch (node.kind) {
    case "range": {
      return bounds("range", { from: present(record["min"]), to: present(record["max"]) });
    }
    case "dateRange": {
      if (text !== undefined) return text === "" ? undefined : { op: "dateRange", range: text };
      // A calendar day prints as `YYYY-MM-DD`; the server reads a date-only `to` as the whole day.
      return bounds("dateRange", { from: day(record["start"]), to: day(record["end"]) });
    }
    case "compare": {
      if (value === null || value === undefined || text === "") return undefined;
      return { op: node.operator ?? "ne", value: text ?? value };
    }
    case "contains": {
      return text === undefined || text === "" ? undefined : { op: "contains", value: text };
    }
    case "isNull": {
      return typeof value === "boolean" ? { op: "isNull", value } : undefined;
    }
    default: {
      return value;
    }
  }
}
