/**
 * Stackra file contract:
 * Purpose: `Filter`, the data constructors of a table filter, as a generated resource table writes them
 *          (`Filter.from("status", { enum: OrderStatus, pinned: true })`, `Filter.dateRange("createdAt")`,
 *          `Filter.compare("totals.totalMinor", FilterComparison.Gte)`).
 * Boundary: pure: each returns a frozen `FilterNode`; the table builder records through them.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2); reporting gap 5 (range, date range, compare, contains, is-null).
 */
import type { Enum } from "@stackra/contracts";

import type { FilterComparison } from "#core/enums/filter-comparison.enum";
import type { FilterNode } from "#core/types/filter-node.type";

/** The options a field filter takes. */
interface FilterOptions {
  readonly default?: unknown;
  readonly pinned?: boolean;
  readonly enum?: Enum.Any;
}

/** A field filter node of `kind`. */
const field = (
  kind: Exclude<FilterNode["kind"], "trashed">,
  key: string,
  options: FilterOptions,
): FilterNode => Object.freeze({ kind, key, ...options });

/**
 * Builds the filter nodes of a resource table.
 *
 * @example
 * Filter.from("status", { enum: OrderStatus, default: [OrderStatus.Paid], pinned: true });
 * Filter.dateRange("createdAt", { default: TimeRange.Last30Days });
 * Filter.trashed();
 */
export const Filter = Object.freeze({
  /** A filter rendered from the field's type. */
  from: (key: string, options: FilterOptions = {}): FilterNode => field("value", key, options),

  /** A principal picker. */
  principal: (key: string, options: FilterOptions = {}): FilterNode =>
    field("principal", key, options),

  /** An inclusive range of numbers or values (`{ op: "range", from, to }`). */
  range: (key: string, options: FilterOptions = {}): FilterNode => field("range", key, options),

  /** A date range: two calendar days, or a `TimeRange` code resolved on the server in the call's time zone. */
  dateRange: (key: string, options: FilterOptions = {}): FilterNode =>
    field("dateRange", key, options),

  /** One comparison with a typed value (`gt`, `gte`, `lt`, `lte`, `ne`). */
  compare: (key: string, operator: FilterComparison, options: FilterOptions = {}): FilterNode =>
    Object.freeze({ kind: "compare", key, operator, ...options }),

  /** A case-insensitive substring; the path needs a pg_trgm index. */
  contains: (key: string, options: FilterOptions = {}): FilterNode =>
    field("contains", key, options),

  /** Whether the field is empty (true) or set (false). */
  isNull: (key: string, options: FilterOptions = {}): FilterNode => field("isNull", key, options),

  /** With, without or only soft-deleted records. */
  trashed: (): FilterNode => Object.freeze({ kind: "trashed" }),
});
