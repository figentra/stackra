/**
 * Stackra file contract:
 * Purpose: `descendantOf`, the `Where` condition "this `ltree` column is the path or below it" (`<@`): a subtree's rows
 *          (`descendantOf(Shops.columns.scopePath, "platform.acme")`).
 * Boundary: builds a parameterised fragment for `Where.$raw`; it only narrows a read inside row-level security and is
 *           never isolation (ADR 0327 d9). A GiST index on the column serves it.
 * Runtime: node
 * Governing contract: ADR 0160 (decision 1); ADR 0327 (decisions 3 and 9).
 */
import type { RawQueryFragment } from "@mikro-orm/core";

import { LTREE_PATH } from "#core/constants/ltree-path.constant";
import { sql } from "#core/functions/sql.function";
import type { ColumnRef } from "#core/values/column-ref.value";

/**
 * The condition that `column` is `path` or one of its descendants.
 *
 * @throws TypeError for a path that is not an `ltree` path.
 * @example
 * await this.count({ $raw: descendantOf(Shops.columns.scopePath, "platform.acme") });
 */
export function descendantOf(column: ColumnRef, path: string): RawQueryFragment {
  if (!LTREE_PATH.test(path)) throw new TypeError(`"${path}" is not an ltree path`);
  return sql`${column} <@ ${path}::ltree`;
}
