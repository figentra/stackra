/**
 * Stackra file contract:
 * Purpose: the `storage` driver of the `QueryPersister` port: it keeps the replicas and the queue in the
 *          `@stackra/storage` areas of the same names (`cache`, `outbox`), sealed with the session's payload key, so
 *          where they live on each target is the storage driver's choice and what rests there is unreadable without the
 *          key in `secrets` (ADR 0338 decision 2).
 * Boundary: no ORM on a client (ADR 0256). It is as encrypted as the bound `PayloadSeal` (`web_crypto` is, `memory` is
 *           not), so a replica is persisted through it only when that holds or `QueryConfig.persistEncrypted` is off;
 *           the queue always is. Any other area is kept as it is. A value the seal cannot open (another or a wiped key,
 *           unreadable text) reads as absent, which is how a wipe makes the device's offline data gone. A write waits
 *           for `storage.flush()`, so a queued call is durable once `enqueue` resolves.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decisions 2 and 3); ADR 0338 (decision 2); ADR 0059 (decisions 1 and 2); ADR 0252
 *                     (decision 3).
 */
import { Driver } from "@stackra/container";
import type { Json } from "@stackra/contracts";
import { StorageArea } from "@stackra/storage";
import { PayloadSeal, Storage } from "@stackra/storage/contracts";

import { QueryPersister } from "#contracts/ports/query-persister.port";

/** The areas whose payloads are sealed at rest. */
const SEALED: ReadonlySet<StorageArea> = new Set([StorageArea.Cache, StorageArea.Outbox]);

/** Keeps the replicas and the queue in client storage, sealed. */
export class StorageQueryPersisterDriver extends Driver(QueryPersister) {
  /** Whether what it writes to `cache` and `outbox` is encrypted at rest: the seal's answer. */
  readonly isEncrypted: boolean;

  private readonly storage: Storage;

  private readonly seal: PayloadSeal;

  /**
   * @param storage - the client storage service.
   * @param seal - seals the `cache` and `outbox` payloads with the session's key.
   */
  constructor(storage: Storage, seal: PayloadSeal) {
    super();
    this.storage = storage;
    this.seal = seal;
    this.isEncrypted = seal.isEncrypting;
  }

  /** The value under `key` in the storage area `area`, opened when the area is sealed; absent when it cannot be. */
  async read(area: StorageArea, key: string): Promise<Json | undefined> {
    const stored = this.storage[area].get(key);
    if (!SEALED.has(area) || stored === undefined) return stored;
    const text = typeof stored === "string" ? await this.seal.open(stored) : undefined;
    if (text === undefined) return undefined;
    try {
      return JSON.parse(text) as Json;
    } catch {
      return undefined;
    }
  }

  /**
   * Stores `value` under `key` in the storage area `area`, sealed when the area is, and waits until storage has
   * persisted it.
   *
   * @throws TypeError when `value` has no JSON form.
   * @throws Error the seal's failure, or the first storage write that failed since the last flush.
   */
  async write(area: StorageArea, key: string, value: unknown): Promise<void> {
    if (SEALED.has(area)) {
      const text = JSON.stringify(value) as string | undefined;
      if (text === undefined)
        throw new TypeError(`"${key}" cannot be stored: a ${typeof value} has no JSON form`);
      this.storage[area].set(key, await this.seal.seal(text));
    } else this.storage[area].set(key, value);
    await this.storage.flush();
  }
}
