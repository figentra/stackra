/**
 * Stackra file contract:
 * Purpose: `Column`, the data constructors of a table column, as a generated resource table writes them
 *          (`Column.money("totals.totalMinor", { currency: "totals.currency", sortable: true })`).
 * Boundary: pure: each returns a frozen `ColumnNode`. The table builder records through the same constructors, so an
 *           authored table and a generated one hold the same nodes.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1, 2 and 13).
 */
import type { Enum } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";

import type { ColumnNode } from "#core/types/column-node.type";

/** The flags a column takes. */
interface ColumnOptions {
  readonly copyable?: boolean;
  readonly sortable?: boolean;
  readonly hidden?: boolean;
  readonly enum?: Enum.Any;
  readonly labels?: Readonly<Record<string, I18nKey>>;
}

/** A frozen column node. */
function column(
  kind: ColumnNode["kind"],
  key: string,
  options: ColumnOptions & { readonly currency?: string },
): ColumnNode {
  return Object.freeze({ kind, key, ...options });
}

/**
 * Builds the column nodes of a resource table.
 *
 * @example
 * Column.from("status", { enum: OrderStatus });
 * Column.money("totals.totalMinor", { currency: "totals.currency", sortable: true });
 */
export const Column = Object.freeze({
  /** A column rendered from the field's type. */
  from: (key: string, options: ColumnOptions = {}): ColumnNode => column("value", key, options),

  /** A principal id as an avatar and a name. */
  principal: (key: string, options: ColumnOptions = {}): ColumnNode =>
    column("principal", key, options),

  /** Minor units as money in the currency at `currency` (a row path or a bind code). */
  money: (key: string, options: ColumnOptions & { readonly currency: string }): ColumnNode =>
    column("money", key, options),

  /** The length of a list field. */
  count: (key: string, options: ColumnOptions = {}): ColumnNode => column("count", key, options),
});
