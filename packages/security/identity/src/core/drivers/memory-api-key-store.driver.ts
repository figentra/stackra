/**
 * Stackra file contract:
 * Purpose: `MemoryApiKeyStoreDriver`, an `ApiKeyStore` held in memory, for tests and local runs: records are added by
 *          hash and read back by hash; a recorded use sets the record's `lastUsedAt`.
 * Boundary: process-local; never a production store. It holds hashes only, like every store.
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (decision 3); ADR 0263 (a driver is named by its class: `memory`); ADR 0410.
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { ApiKeyStore } from "#contracts/index";
import type { ApiKeyRecord } from "#contracts/index";

/**
 * Keeps API key records in memory.
 *
 * @example
 * const store = new MemoryApiKeyStoreDriver();
 * store.add({ id: "key_1", hash: await hashApiKey(key), principal: "usr_bot", scopes: [], origins: [] });
 */
export class MemoryApiKeyStoreDriver extends Driver(ApiKeyStore) {
  /** Hash to record. */
  private readonly records = new Map<string, ApiKeyRecord>();

  /** Keeps `record`, replacing one with the same hash. */
  add(record: ApiKeyRecord): void {
    this.records.set(record.hash, record);
  }

  /** Implements `ApiKeyStore.findByHash`, documented there. */
  findByHash(hash: string): Promise<ApiKeyRecord | undefined> {
    return Promise.resolve(this.records.get(hash));
  }

  /** See `ApiKeyStore.recordUse`; an unknown id is ignored. */
  override recordUse(id: PublicId, at: Date): Promise<void> {
    for (const [hash, record] of this.records)
      if (record.id === id) this.records.set(hash, { ...record, lastUsedAt: at });
    return Promise.resolve();
  }
}
