/**
 * Stackra file contract:
 * Purpose: `Relations<R>`, the builder a resource's `relations(r)` member receives: one relation manager per call, a table
 *          over a same-module list query.
 * Boundary: a type only; the columns are paths of the query's row. Gen binds the query's record id input from the record
 *           `R`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 11: relation managers).
 */
import type { AnyClass } from "@stackra/container";

import type { Built } from "#core/types/built.type";
import type { ColumnBuilder } from "#core/types/column-builder.type";
import type { ColumnFactory } from "#core/types/column-factory.type";
import type { Path } from "#core/types/path.type";
import type { QueryRow } from "#core/types/query-row.type";
import type { RelationNode } from "#core/types/relation-node.type";

/**
 * Builds the relation managers of a View page over record type `R`.
 *
 * @example
 * override relations(r: Relations<OrderView>) {
 *   return [r.table(ListOrderLinesQuery, (c) => [c.from("sku"), c.from("quantity")])];
 * }
 */
export interface Relations<R> {
  /**
   * A table of the rows `query` lists for the record. `bind` maps a query input to a record path when gen cannot
   * derive it (the record id input is derived).
   */
  table: <Q extends AnyClass>(
    query: Q,
    build: (column: ColumnFactory<QueryRow<Q>>) => readonly ColumnBuilder[],
    options?: { readonly bind?: Readonly<Record<string, Path<R>>> },
  ) => Built<RelationNode>;
}
