/**
 * Stackra file contract:
 * Purpose: unit tests of `StorageQueryPersisterDriver`: a driver of `QueryPersister` that reports no encryption, reads
 *          and writes the storage area of the same name, keeps the two areas apart, waits for storage to persist, and
 *          refuses a value with no JSON form.
 * Boundary: test only; storage is the real memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0256; ADR 0059.
 */
import { MemoryStorageDriver, StorageArea } from "@stackra/storage";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { QueryPersister } from "#contracts/ports/query-persister.port";
import { StorageQueryPersisterDriver } from "#core/drivers/storage-query-persister.driver";

describe("StorageQueryPersisterDriver", () => {
  it("is a QueryPersister that reports no encryption", () => {
    const persister = new StorageQueryPersisterDriver(new MemoryStorageDriver());
    expect(persister).toBeInstanceOf(QueryPersister);
    expect(persister.isEncrypted).toBe(false);
  });

  it("writes and reads the storage area of the same name, waiting for it to persist", async () => {
    const storage = new MemoryStorageDriver();
    const flush = vi.spyOn(storage, "flush");
    const persister = new StorageQueryPersisterDriver(storage);
    await persister.write(StorageArea.Outbox, "query.queue.usr_1", { version: 1, items: [] });
    expect(flush).toHaveBeenCalledTimes(1);
    expect(storage.outbox.get("query.queue.usr_1")).toEqual({ version: 1, items: [] });
    await expect(persister.read(StorageArea.Outbox, "query.queue.usr_1")).resolves.toEqual({
      version: 1,
      items: [],
    });
    await expect(persister.read(StorageArea.Cache, "query.queue.usr_1")).resolves.toBeUndefined();
  });

  it("refuses a value with no JSON form", async () => {
    const persister = new StorageQueryPersisterDriver(new MemoryStorageDriver());
    await expect(persister.write(StorageArea.Cache, "key", () => 1)).rejects.toThrow(TypeError);
  });
});
