/**
 * Stackra file contract:
 * Purpose: `deleteFilters(entities)`, the MikroORM `filters` option of `connect`: the `deleted` and `archived` filters,
 *          on by default, each limited to the registered entities whose model has its trait, so every read of a
 *          soft-deleted or archived row is left out unless the read turns the filter off.
 * Boundary: internal to the drivers' `connect` (Postgres and memory, kept the same). A filter no entity needs is left
 *           out. The trait comes from @stackra/model's registry (`traitsOf`) on the schema's class.
 * Runtime: node
 * Governing contract: ADR 0134 (decision 4); ADR 0096 (decision 4: traits run in the database layer).
 */
import type { EntitySchema } from "@mikro-orm/core";
import { traitsOf } from "@stackra/model";

import { DELETE_FILTERS } from "#core/constants/delete-filters.constant";

/** One filter definition as MikroORM's `filters` option takes it. */
interface FilterDefinition {
  readonly cond: Record<string, null>;
  readonly default: true;
  readonly entity: string[];
}

/**
 * The filters for `entities`.
 *
 * @example
 * MikroORM.init({ entities, filters: deleteFilters(entities) });
 */
export function deleteFilters(entities: Iterable<EntitySchema>): Record<string, FilterDefinition> {
  const filters: Record<string, FilterDefinition> = {};
  for (const [name, { trait, field }] of Object.entries(DELETE_FILTERS)) {
    const entity = [...entities]
      .filter((schema) => traitsOf(schema.meta.class).some((record) => record.name === trait))
      .map((schema) => schema.meta.className);
    if (entity.length > 0) filters[name] = { cond: { [field]: null }, default: true, entity };
  }
  return filters;
}
