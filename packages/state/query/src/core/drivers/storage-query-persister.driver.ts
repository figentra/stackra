/**
 * Stackra file contract:
 * Purpose: the `storage` driver of the `QueryPersister` port: it keeps the cache and the queue in the `@stackra/storage`
 *          areas of the same names (`cache`, `outbox`), so where they live on each target is the storage driver's
 *          choice (Web Storage, SQLite, memory).
 * Boundary: no ORM on a client (ADR 0256). `Storage` does not say whether an area is encrypted, so this driver reports
 *           `isEncrypted: false` and the cache is persisted through it only when `QueryConfig.persistEncrypted` is
 *           off; the queue always is. A write waits for `storage.flush()`, so a queued call is durable once
 *           `enqueue` resolves.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decisions 2 and 3); ADR 0059 (decisions 1 and 2); ADR 0252 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { Json } from "@stackra/contracts";
import type { StorageArea } from "@stackra/storage";
import { Storage } from "@stackra/storage/contracts";

import { QueryPersister } from "#contracts/ports/query-persister.port";

/** Keeps the cache and the queue in client storage. */
export class StorageQueryPersisterDriver extends Driver(QueryPersister) {
  /** Storage reports no encryption, so the cache is never trusted to it while encryption is required. */
  readonly isEncrypted = false;

  private readonly storage: Storage;

  /** @param storage - the client storage service. */
  constructor(storage: Storage) {
    super();
    this.storage = storage;
  }

  /** The value under `key` in the storage area `area`. */
  read(area: StorageArea, key: string): Promise<Json | undefined> {
    return Promise.resolve(this.storage[area].get(key));
  }

  /**
   * Stores `value` under `key` in the storage area `area` and waits until storage has persisted it.
   *
   * @throws TypeError when `value` has no JSON form.
   * @throws Error the first storage write that failed since the last flush.
   */
  async write(area: StorageArea, key: string, value: unknown): Promise<void> {
    this.storage[area].set(key, value);
    await this.storage.flush();
  }
}
