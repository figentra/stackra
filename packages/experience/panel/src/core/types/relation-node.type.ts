/**
 * Stackra file contract:
 * Purpose: `RelationNode`, one recorded relation manager of a View page: a table over a same-module list query whose
 *          record id input gen binds from the record.
 * Boundary: a type only; built by `Relation.table` and by the relations builder.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 11: relation managers are `r.table(Query, columns)` over same-module data).
 */
import type { AnyClass } from "@stackra/container";

import type { ColumnNode } from "#core/types/column-node.type";

/** One relation manager. */
export interface RelationNode {
  /** A table of related rows. */
  readonly kind: "table";

  /** The list query it runs. */
  readonly query: AnyClass;

  /** The columns, paths of the query's row. */
  readonly columns: readonly ColumnNode[];

  /** The query inputs bound from the record (`{ orderId: "record.id" }`); gen fills them. */
  readonly bind?: Readonly<Record<string, string>>;
}
