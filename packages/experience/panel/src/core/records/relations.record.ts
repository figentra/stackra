/**
 * Stackra file contract:
 * Purpose: `RelationsRecord<R>`, the builder a resource's `relations(r)` member receives: the runtime side of
 *          `Relations<R>`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 11).
 */
import type { AnyClass } from "@stackra/container";

import { Relation } from "#core/constants/relation.constant";
import { ColumnsRecord } from "#core/records/columns.record";
import type { Built } from "#core/types/built.type";
import type { ColumnBuilder } from "#core/types/column-builder.type";
import type { ColumnFactory } from "#core/types/column-factory.type";
import type { Path } from "#core/types/path.type";
import type { QueryRow } from "#core/types/query-row.type";
import type { RelationNode } from "#core/types/relation-node.type";
import type { Relations } from "#core/types/relations.type";

/** Builds relation managers over record type `R`. */
export class RelationsRecord<R> implements Relations<R> {
  /** A table of the rows `query` lists for the record. */
  table<Q extends AnyClass>(
    query: Q,
    build: (column: ColumnFactory<QueryRow<Q>>) => readonly ColumnBuilder[],
    options: { readonly bind?: Readonly<Record<string, Path<R>>> } = {},
  ): Built<RelationNode> {
    const columns = build(new ColumnsRecord<QueryRow<Q>>());
    const bind = options.bind;
    return {
      toNode: () =>
        Relation.table(query, {
          columns: columns.map((column) => column.toNode()),
          ...(bind === undefined
            ? {}
            : {
                bind: Object.fromEntries(
                  Object.entries(bind).map(([input, path]) => [input, `record.${path}`]),
                ),
              }),
        }),
    };
  }
}
