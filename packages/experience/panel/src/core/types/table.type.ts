/**
 * Stackra file contract:
 * Purpose: `Table<R>`, the builder a resource's `table(t)` member receives: columns, filters, the default sort and the count
 *          mode, every key a path of the list row `R`.
 * Boundary: a type only; chainable, each call returns the same builder. Gen runs the member once and compiles the result
 *           into the list query's closed `TableInput`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1, 2, 5 and 12).
 */
import type { SortDirection } from "@stackra/contracts";

import type { Count } from "#core/enums/count.enum";
import type { Built } from "#core/types/built.type";
import type { ColumnBuilder } from "#core/types/column-builder.type";
import type { ColumnFactory } from "#core/types/column-factory.type";
import type { FilterBuilder } from "#core/types/filter-builder.type";
import type { FilterFactory } from "#core/types/filter-factory.type";
import type { Path } from "#core/types/path.type";
import type { TableNode } from "#core/types/table-node.type";

/**
 * A resource table over row type `R`.
 *
 * @example
 * override table(t: Table<OrderView>) {
 *   return t
 *     .columns((c) => [c.from("id").copyable(), c.money("totals.totalMinor", { currency: "totals.currency" })])
 *     .filters((f) => [f.from("status").pinned()])
 *     .defaultSort("createdAt", SortDirection.Desc);
 * }
 */
export interface Table<R> extends Built<TableNode> {
  /** Sets the columns, in order. */
  columns(build: (column: ColumnFactory<R>) => readonly ColumnBuilder[]): this;

  /** Sets the filters, in order. */
  filters(build: (filter: FilterFactory<R>) => readonly FilterBuilder[]): this;

  /** Sets the sort a fresh list starts with. */
  defaultSort(key: Path<R>, direction: SortDirection): this;

  /** Sets how rows are counted; estimated by default. */
  count(count: Count): this;
}
