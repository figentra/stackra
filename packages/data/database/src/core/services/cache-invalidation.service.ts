/**
 * Stackra file contract:
 * Purpose: `CacheInvalidationService`, the outbox change consumer that evicts a changed row from the shared cache: a
 *          committed create, update or delete of a row forgets `CacheKey.of(Model, id)`, which covers every entity
 *          cache entry of the row (each scope's) and every shared entry a service keyed under it. Writes that skip
 *          actions (imports, seeders, native writes, other services) evict too.
 * Boundary: a `ChangeConsumer` by shape (`consume`, `consumeMany`), registered by gen against each `Cached` model with
 *           @stackra/outbox's `registerChangeConsumers` and resolved by the relay; this package never imports
 *           @stackra/outbox, which depends on it. It forgets under `SHARED_CACHE_CONTEXT`; an entry a service wrote in a
 *           scope namespace is not reached. Forgetting is idempotent, so a redelivery changes nothing; a throwing cache
 *           makes the relay retry from the consumer's cursor.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 3: invalidation from changes); ADR 0221 (decision 5) and ADR 0078 (decision
 *                     4: idempotent consumers); data-layer gaps ca4 and cdc10.
 */
import type { ContextStorage } from "@stackra/actions/contracts";
import { CacheKey } from "@stackra/cache";
import type { Cache } from "@stackra/cache/contracts";
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

import { SHARED_CACHE_CONTEXT } from "#core/constants/shared-cache-context.constant";
import type { Database } from "#core/ports/database.port";
import type { ChangedRow } from "#core/types/changed-row.type";

/**
 * Evicts changed rows from the shared cache.
 *
 * @example
 * registerChangeConsumers([[Product, CacheInvalidationService]]); // gen, for each Cached model
 * // a committed Product change: cache.forget(CacheKey.of(Product, change.id))
 */
export class CacheInvalidationService extends Service {
  /** The shared cache. */
  private readonly cache: Cache;

  /** Where the running call's context is kept, so the forget leaves it. */
  private readonly storage: ContextStorage;

  /** The connected database, whose metadata names each changed model's class. */
  private readonly database: Database;

  /**
   * @param cache - the bound cache.
   * @param storage - the context storage calls run in.
   * @param database - the connected database.
   */
  constructor(cache: Cache, storage: ContextStorage, database: Database) {
    super();
    this.cache = cache;
    this.storage = storage;
    this.database = database;
  }

  /** Forgets the changed row. */
  consume(change: ChangedRow): Promise<void> {
    return this.consumeMany([change]);
  }

  /** Forgets each changed row of a run once; a model the database does not know has nothing cached and is skipped. */
  async consumeMany(changes: readonly ChangedRow[]): Promise<void> {
    const metadata = this.database.em().getMetadata();
    const keys = new Set<CacheKey>();
    for (const change of changes) {
      const model = metadata.getByClassName(change.model, false)?.class;
      // reason: the ORM types an entity class as a bare Function; it is the model class the reads keyed with
      if (model !== undefined) keys.add(CacheKey.of(model as AnyClass, change.id));
    }
    await this.storage.run(SHARED_CACHE_CONTEXT, async () => {
      for (const key of keys) await this.cache.forget(key);
    });
  }
}
