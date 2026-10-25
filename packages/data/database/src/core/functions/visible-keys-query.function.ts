/**
 * Stackra file contract:
 * Purpose: `visibleKeysQuery`, the parameterised SQL subquery of the primary keys of `model` the running call's actor
 *          may see under the bound `VisibilityFilter`, for a read path that ranks in raw SQL (search) and must apply
 *          record visibility before it scores, not after.
 * Boundary: built by the ORM's query builder from the same conditions `visibleFilter` ANDs into every read, so it never
 *           widens or differs from them. `undefined` when no visibility driver is connected or the model declares
 *           none, and then the caller adds nothing. Scope isolation stays row-level security; this narrows inside it.
 * Runtime: node
 * Governing contract: ADR 0333 (decisions 4 and 5, and its amendment: the filter bounds search results); ADR 0160
 *                     (raw SQL is parameterised).
 */
import type { QBFilterQuery } from "@mikro-orm/postgresql";
import type { AnyClass } from "@stackra/container";

import { visibleFilter } from "#core/functions/visible-filter.function";
import { Database } from "#core/ports/database.port";
import type { Where } from "#contracts/types/where.type";

/**
 * The subquery of the visible keys of `model`, or `undefined` when every row in the session is visible.
 *
 * @example
 * const visible = await visibleKeysQuery(Matter);
 * const where = visible === undefined ? "" : ` and t."id" in (${visible.sql})`;
 */
export async function visibleKeysQuery<M extends object>(
  model: AnyClass<M>,
): Promise<{ readonly sql: string; readonly params: readonly unknown[] } | undefined> {
  const filter = await visibleFilter(model, {} as Where<M>);
  if (typeof filter !== "object" || filter === null || !("$and" in filter)) return undefined;
  const em = Database.current().em();
  const [key = "id"] = em.getMetadata(model).primaryKeys;
  return em
    .createQueryBuilder(model, "visible")
    .select(key as never)
    .where(filter as QBFilterQuery<M>)
    .toQuery();
}
