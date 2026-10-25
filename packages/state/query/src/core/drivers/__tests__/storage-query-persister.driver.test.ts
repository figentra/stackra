/**
 * Stackra file contract:
 * Purpose: unit tests of `StorageQueryPersisterDriver`: a driver of `QueryPersister` as encrypted as its seal, which
 *          seals what it writes to `cache` and `outbox` (nothing readable rests there), opens it again while the key is
 *          in `secrets`, reads it as absent once `secrets` is wiped, keeps other areas plain and the areas apart, waits
 *          for storage to persist, and refuses a value with no JSON form.
 * Boundary: test only; storage is the real memory driver and the seals are storage's real drivers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0256; ADR 0059; ADR 0338 (decision 2).
 */
import {
  MemoryPayloadSealDriver,
  MemoryStorageDriver,
  StorageArea,
  WebCryptoPayloadSealDriver,
} from "@stackra/storage";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { QueryPersister } from "#contracts/ports/query-persister.port";
import { StorageQueryPersisterDriver } from "#core/drivers/storage-query-persister.driver";

/** A persister over fresh memory storage, sealed with AES-GCM. */
function persisterOf() {
  const storage = new MemoryStorageDriver();
  return {
    storage,
    persister: new StorageQueryPersisterDriver(storage, new WebCryptoPayloadSealDriver(storage)),
  };
}

describe("StorageQueryPersisterDriver", () => {
  it("is a QueryPersister exactly as encrypted as its seal", () => {
    const { persister } = persisterOf();
    expect(persister).toBeInstanceOf(QueryPersister);
    expect(persister.isEncrypted).toBe(true);
    const storage = new MemoryStorageDriver();
    expect(
      new StorageQueryPersisterDriver(storage, new MemoryPayloadSealDriver(storage)).isEncrypted,
    ).toBe(false);
  });

  it("seals what it writes to outbox and cache, and opens it again, waiting for storage to persist", async () => {
    const { storage, persister } = persisterOf();
    const flush = vi.spyOn(storage, "flush");
    await persister.write(StorageArea.Outbox, "query.queue.usr_1", { version: 2, items: [] });
    expect(flush).toHaveBeenCalledTimes(1);
    const stored = storage.outbox.get("query.queue.usr_1");
    expect(typeof stored).toBe("string");
    expect(String(stored)).not.toContain("items");
    await expect(persister.read(StorageArea.Outbox, "query.queue.usr_1")).resolves.toEqual({
      version: 2,
      items: [],
    });
    await expect(persister.read(StorageArea.Cache, "query.queue.usr_1")).resolves.toBeUndefined();
  });

  it("reads a sealed value as absent once secrets is wiped, or when it was never sealed", async () => {
    const { storage, persister } = persisterOf();
    await persister.write(StorageArea.Cache, "query.replica.usr_1.sales", { version: 1 });
    storage.secrets.clear();
    await expect(
      persister.read(StorageArea.Cache, "query.replica.usr_1.sales"),
    ).resolves.toBeUndefined();
    storage.outbox.set("query.queue.usr_2", { version: 2, items: [] });
    await expect(persister.read(StorageArea.Outbox, "query.queue.usr_2")).resolves.toBeUndefined();
  });

  it("keeps any other area as it is", async () => {
    const { storage, persister } = persisterOf();
    await persister.write(StorageArea.Prefs, "query.flag", { on: true });
    expect(storage.prefs.get("query.flag")).toEqual({ on: true });
    await expect(persister.read(StorageArea.Prefs, "query.flag")).resolves.toEqual({ on: true });
  });

  it("refuses a value with no JSON form", async () => {
    const { persister } = persisterOf();
    await expect(persister.write(StorageArea.Cache, "key", () => 1)).rejects.toThrow(TypeError);
    await expect(persister.write(StorageArea.Prefs, "key", () => 1)).rejects.toThrow(TypeError);
  });
});
