/**
 * Stackra file contract:
 * Purpose: `Cached({ ttl })`, the trait of a model whose rows are read through the entity (second-level) cache:
 *          `CrudService.findOne` and `findOneOrFail` by `{ id }` answer from the shared `Cache` for `ttl`, and a
 *          committed change of the row evicts it through the outbox change feed (`CacheInvalidationService`).
 * Boundary: a marker with options: it adds no field. @stackra/database reads it through `cacheTtlOf`; lists, filtered
 *           reads and every read inside a transaction stay on the database (collections belong to the query cache).
 *           A model with encrypted fields may not be cached (`cacheTtlOf` refuses it), so plaintext never reaches a
 *           shared store.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 5: second-level cache; decision 3: invalidation from changes); ADR 0305
 *                     (rule 33: no `@Cacheable`, a trait instead); ADR 0096 (decision 1); data-layer gaps ca4 and ca5.
 */
import { Duration } from "@stackra/contracts";

import { createTrait } from "#core/functions/create-trait.function";
import type { CachedOptions } from "#core/types/cached-options.type";
import type { Trait } from "#core/types/trait.type";

/**
 * The entity cache trait.
 *
 * @throws TypeError when `ttl` is not longer than zero.
 * @example
 * export class Product extends Model.with(HasPublicId("prd"), Cached({ ttl: Duration.minutes(10) })) {}
 */
export function Cached(options: CachedOptions): Trait<object> {
  if (Duration.toMilliseconds(options.ttl) <= 0)
    throw new TypeError("Cached keeps a row for longer than zero");
  return createTrait("cached", (base) => class extends base {}, { ttl: options.ttl });
}
