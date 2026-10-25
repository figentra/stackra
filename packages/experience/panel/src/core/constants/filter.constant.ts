/**
 * Stackra file contract:
 * Purpose: `Filter`, the data constructors of a table filter, as a generated resource table writes them
 *          (`Filter.from("status", { enum: OrderStatus, pinned: true })`).
 * Boundary: pure: each returns a frozen `FilterNode`; the table builder records through them.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2).
 */
import type { Enum } from "@stackra/contracts";

import type { FilterNode } from "#core/types/filter-node.type";

/** The options a field filter takes. */
interface FilterOptions {
  readonly default?: unknown;
  readonly pinned?: boolean;
  readonly enum?: Enum.Any;
}

/**
 * Filter nodes.
 *
 * @example
 * Filter.from("status", { enum: OrderStatus, default: [OrderStatus.Paid], pinned: true });
 * Filter.trashed();
 */
export const Filter = Object.freeze({
  /** A filter rendered from the field's type. */
  from: (key: string, options: FilterOptions = {}): FilterNode =>
    Object.freeze({ kind: "value", key, ...options }),

  /** A principal picker. */
  principal: (key: string, options: FilterOptions = {}): FilterNode =>
    Object.freeze({ kind: "principal", key, ...options }),

  /** With, without or only soft-deleted records. */
  trashed: (): FilterNode => Object.freeze({ kind: "trashed" }),
});
