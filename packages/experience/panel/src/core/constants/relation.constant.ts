/**
 * Stackra file contract:
 * Purpose: `Relation`, the data constructor of a View page's relation manager
 *          (`Relation.table(ListOrderLinesQuery, { bind: { orderId: "record.id" }, columns: [...] })`).
 * Boundary: pure: returns a frozen `RelationNode`; the relations builder records through it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 11: relation managers over same-module data).
 */
import type { AnyClass } from "@stackra/container";

import type { ColumnNode } from "#core/types/column-node.type";
import type { RelationNode } from "#core/types/relation-node.type";

/**
 * Relation nodes.
 *
 * @example
 * Relation.table(ListOrderLinesQuery, { bind: { orderId: "record.id" }, columns: [Column.from("sku")] });
 */
export const Relation = Object.freeze({
  /** A table of the rows `query` lists for the record. */
  table: (
    query: AnyClass,
    options: {
      readonly columns: readonly ColumnNode[];
      readonly bind?: Readonly<Record<string, string>>;
    },
  ): RelationNode =>
    Object.freeze({
      kind: "table",
      query,
      columns: Object.freeze([...options.columns]),
      ...(options.bind === undefined ? {} : { bind: Object.freeze({ ...options.bind }) }),
    }),
});
