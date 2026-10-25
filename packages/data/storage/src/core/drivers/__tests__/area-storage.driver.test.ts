/**
 * Stackra file contract:
 * Purpose: unit tests of `AreaStorageDriver`: six independent areas named by their codes, memory for an area without a
 *          backend, `store(type)` routed to the registered area, and `hydrate()` and `flush()` across every area.
 * Boundary: test only; a test-local subclass passes recording backends, as a platform driver would.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0256 (decisions 2 and 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { Storage } from "#contracts/ports/storage.port";
import { AreaStorageDriver } from "#core/drivers/area-storage.driver";
import { StorageArea } from "#core/enums/storage-area.enum";
import { registerStorageKeys } from "#core/functions/register-storage-keys.function";
import type { StorageBackend } from "#core/types/storage-backend.type";

/** A driver over the given backends. */
class TestStorageDriver extends AreaStorageDriver {
  constructor(backends: Partial<Record<StorageArea, StorageBackend>> = {}) {
    super(backends);
  }
}

class PreferencesStore {
  tenantByUser: Record<string, string> = {};
}

class DraftStore {
  text = "";
}

class Unregistered {}

registerStorageKeys([
  [PreferencesStore, { key: "mobile.preferences" }],
  [DraftStore, { key: "mobile.draft", area: StorageArea.Session }],
]);

describe("AreaStorageDriver", () => {
  it("is a Storage with six independent areas", () => {
    const storage = new TestStorageDriver();
    expect(storage).toBeInstanceOf(Storage);
    storage.prefs.set("k", "prefs");
    storage[StorageArea.Cache].set("k", "cache");
    expect(storage.prefs.get("k")).toBe("prefs");
    expect(storage.cache.get("k")).toBe("cache");
    expect(storage.session.has("k")).toBe(false);
  });

  it("persists an area through its backend and keeps the others in memory", async () => {
    const saved: string[] = [];
    const storage = new TestStorageDriver({
      prefs: {
        load: () => [],
        save: (key) => {
          saved.push(key);
        },
        remove: () => undefined,
      },
    });
    storage.prefs.set("a", 1);
    storage.secrets.set("token", "t");
    await storage.flush();
    expect(saved).toEqual(["a"]);
  });

  it("stores a class's state in its registered area", () => {
    const storage = new TestStorageDriver();
    storage.store(PreferencesStore).write({ tenantByUser: { usr_1: "ten_2" } });
    storage.store(DraftStore).write({ text: "hello" });
    expect(storage.prefs.get("mobile.preferences")).toEqual({ tenantByUser: { usr_1: "ten_2" } });
    expect(storage.store(PreferencesStore).read()).toEqual({ tenantByUser: { usr_1: "ten_2" } });
    expect(storage.session.get("mobile.draft")).toEqual({ text: "hello" });
    storage.store(DraftStore).clear();
    expect(storage.store(DraftStore).read()).toBeUndefined();
  });

  it("throws for a class gen registered no key for", () => {
    expect(() => new TestStorageDriver().store(Unregistered)).toThrow(TypeError);
  });

  it("hydrates every area and flushes every area's failure", async () => {
    const storage = new TestStorageDriver({
      cache: {
        load: async () => [["a", '{"v":1}']],
        save: () => undefined,
        remove: () => undefined,
      },
      files: {
        load: () => [],
        save: () => {
          throw new Error("disk full");
        },
        remove: () => undefined,
      },
    });
    await storage.hydrate();
    expect(storage.cache.get("a")).toBe(1);
    storage.files.set("f", "x");
    await expect(storage.flush()).rejects.toThrow("disk full");
  });
});
