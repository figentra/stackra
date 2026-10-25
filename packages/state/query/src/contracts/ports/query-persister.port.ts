/**
 * Stackra file contract:
 * Purpose: the `QueryPersister` port: where the query cache (area `cache`) and the offline queue (area `outbox`) are
 *          kept between launches, and whether what it writes is encrypted at rest.
 * Boundary: an abstract class that is its own token, keyed `query.QueryPersister`. Values are JSON-safe; a write
 *           resolves once the value is durable, so a queued call survives a crash after `enqueue` resolves. The cache is
 *           written only through a persister that encrypts while `QueryConfig.persistEncrypted` is on (ADR 0059
 *           decision 1); the queue is always written, because losing it loses the user's work. No ORM on a client:
 *           the default driver writes through `@stackra/storage` (ADR 0256).
 * Runtime: isomorphic
 * Governing contract: ADR 0059 (decisions 1 and 2); ADR 0252 (decision 3); ADR 0256; ADR 0294 (decisions 4, 15
 *                     and 16).
 */
import { Port } from "@stackra/contracts";
import type { Json } from "@stackra/contracts";
import type { StorageArea } from "@stackra/storage";

/**
 * Keeps the query cache and the offline queue.
 *
 * @example
 * export class StorageQueryPersisterDriver extends Driver(QueryPersister) {
 *   readonly isEncrypted = false;
 *   read(area: StorageArea, key: string): Promise<Json | undefined> {
 *     return Promise.resolve(this.storage[area].get(key));
 *   }
 * }
 */
export abstract class QueryPersister extends Port {
  /** Type-only port key, so `DriverName<QueryPersister>` narrows to this port's drivers. */
  declare readonly "~key": "query.QueryPersister";

  /** Whether what this persister writes is encrypted at rest. */
  abstract readonly isEncrypted: boolean;

  /** The value kept under `key` in `area` (`cache` or `outbox`), or `undefined` when there is none. */
  abstract read(area: StorageArea, key: string): Promise<Json | undefined>;

  /**
   * Keeps `value`, a plain JSON-safe value, under `key` in `area`, replacing what was there; resolves once it is
   * durable.
   *
   * @throws TypeError when `value` has no JSON form.
   * @throws Error when the value cannot be kept (quota, a refused store); the caller keeps its copy in memory.
   */
  abstract write(area: StorageArea, key: string, value: unknown): Promise<void>;
}
