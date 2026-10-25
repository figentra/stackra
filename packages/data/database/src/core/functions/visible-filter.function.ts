/**
 * Stackra file contract:
 * Purpose: `visibleFilter`, the MikroORM filter of a read: the caller's `where`, ANDed with the conditions the bound
 *          `VisibilityFilter` returns for the model and the running call's actor.
 * Boundary: internal; the one place `CrudService`, `GraphQuery` and `MetricsReader` take their filter from, so no read
 *           path of a declaring model misses the conditions. It only ever narrows: the caller's filter is kept whole and
 *           the conditions are ANDed to it. With no resolver connected or no driver bound it returns `filterOf(where)`.
 * Runtime: node
 * Governing contract: ADR 0333 (decisions 4 and 5, and its amendment); ADR 0160 (`$raw` stays a parameterised
 *                     fragment on both sides).
 */
import type { FilterQuery } from "@mikro-orm/core";
import type { ExtensionContext } from "@stackra/actions";
import { ContextStorage } from "@stackra/actions/contracts";
import type { AnyClass } from "@stackra/container";

import { VISIBILITY_HOST } from "#core/constants/visibility-host.constant";
import { filterOf } from "#core/functions/filter-of.function";
import { VisibilityFilter } from "#core/ports/visibility-filter.port";
import type { Where } from "#core/types/where.type";

/**
 * The filter of a read of `model`.
 *
 * @example
 * const filter = await visibleFilter(Order, { status: "paid" }); // { $and: [{ status: "paid" }, conditions] }
 */
export async function visibleFilter<M extends object>(
  model: AnyClass<M>,
  where: Where<M>,
): Promise<FilterQuery<M>> {
  const filter = filterOf(where);
  const { resolver } = VISIBILITY_HOST;
  if (resolver === undefined || !resolver.has(VisibilityFilter)) return filter;
  const context = resolver.has(ContextStorage)
    ? (resolver.get(ContextStorage).current() as ExtensionContext | undefined)
    : undefined;
  const conditions = filterOf(
    await resolver.get(VisibilityFilter).conditionsFor(model, context?.actor),
  );
  const empty =
    typeof conditions === "object" &&
    conditions !== null &&
    Reflect.ownKeys(conditions).length === 0;
  return empty ? filter : ({ $and: [filter, conditions] } as FilterQuery<M>);
}
