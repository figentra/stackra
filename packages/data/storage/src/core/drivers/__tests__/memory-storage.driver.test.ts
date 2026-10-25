/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryStorageDriver`: a `Storage` the container binds, whose instances never share state,
 *          whose lifecycle calls resolve at once, and that persists nothing past the instance.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0256 (decision 3); ADR 0266 (memory drivers first).
 */
import { Container } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { Storage } from "#contracts/ports/storage.port";
import { MemoryStorageDriver } from "#core/drivers/memory-storage.driver";

describe("MemoryStorageDriver", () => {
  it("is a Storage the container binds", async () => {
    const storage = new MemoryStorageDriver();
    const container = await Container.create([], { overrides: new Map([[Storage, storage]]) });
    expect(container.get(Storage)).toBe(storage);
  });

  it("keeps each instance's values to itself", () => {
    const first = new MemoryStorageDriver();
    first.prefs.set("console.ui", { density: "compact" });
    expect(first.prefs.get("console.ui")).toEqual({ density: "compact" });
    expect(new MemoryStorageDriver().prefs.has("console.ui")).toBe(false);
  });

  it("resolves hydrate and flush at once", async () => {
    const storage = new MemoryStorageDriver();
    storage.outbox.set("op_1", { action: "orders.order.create@1" });
    await expect(storage.hydrate()).resolves.toBeUndefined();
    await expect(storage.flush()).resolves.toBeUndefined();
  });
});
