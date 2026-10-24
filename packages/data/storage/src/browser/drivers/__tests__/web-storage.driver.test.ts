/**
 * Stackra file contract:
 * Purpose: unit tests of `WebStorageDriver`: `prefs` and `cache` survive a new driver over the same `localStorage`,
 *          `session` uses `sessionStorage`, each area sees only its own prefixed keys, secrets never reach Web Storage,
 *          a refused Web Storage falls back to memory, and a quota error surfaces on `flush()`.
 * Boundary: test only; Web Storage is a test-local in-memory implementation put on `globalThis`, so no DOM is needed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0256 (decisions 2 to 4).
 */
import { afterEach, describe, expect, it, vi } from "@stackra/testing";

import { WebStorageDriver } from "#browser/drivers/web-storage.driver";
import { Storage } from "#contracts/ports/storage.port";

/** The parts of Web Storage the driver uses, over a map. */
class FakeWebStorage {
  readonly items = new Map<string, string>();

  get length(): number {
    return this.items.size;
  }

  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }
}

/** Puts fresh Web Storage on `globalThis` and returns it. */
function stubWebStorage() {
  const local = new FakeWebStorage();
  const session = new FakeWebStorage();
  vi.stubGlobal("localStorage", local);
  vi.stubGlobal("sessionStorage", session);
  return { local, session };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WebStorageDriver", () => {
  it("is a Storage", () => {
    stubWebStorage();
    expect(new WebStorageDriver()).toBeInstanceOf(Storage);
  });

  it("keeps prefs and cache in localStorage across drivers", async () => {
    const { local } = stubWebStorage();
    const first = new WebStorageDriver();
    first.prefs.set("console.ui", { density: "compact" });
    first.cache.set("catalogue.page_1", [1]);
    await first.flush();
    expect(local.getItem("stackra:prefs:console.ui")).toBe('{"v":{"density":"compact"}}');
    const second = new WebStorageDriver();
    expect(second.prefs.get("console.ui")).toEqual({ density: "compact" });
    expect(second.cache.get("catalogue.page_1")).toEqual([1]);
    expect(second.prefs.has("catalogue.page_1")).toBe(false);
  });

  it("keeps session values in sessionStorage", async () => {
    const { local, session } = stubWebStorage();
    const storage = new WebStorageDriver();
    storage.session.set("draft", "hello");
    await storage.flush();
    expect(session.getItem("stackra:session:draft")).toBe('{"v":"hello"}');
    expect(local.items.size).toBe(0);
  });

  it("never reads or touches the origin's other keys", async () => {
    const { local } = stubWebStorage();
    local.setItem("theme", "dark");
    const storage = new WebStorageDriver();
    expect(storage.prefs.keys()).toEqual([]);
    storage.prefs.clear();
    await storage.flush();
    expect(local.getItem("theme")).toBe("dark");
  });

  it("never writes secrets, the outbox or files to Web Storage", async () => {
    const { local, session } = stubWebStorage();
    const storage = new WebStorageDriver();
    storage.secrets.set("refresh_token", "rt_1");
    storage.outbox.set("op_1", {});
    storage.files.set("f", "x");
    await storage.flush();
    expect(storage.secrets.get("refresh_token")).toBe("rt_1");
    expect(local.items.size + session.items.size).toBe(0);
  });

  it("falls back to memory when the browser refuses Web Storage", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("SecurityError: access is denied");
      },
    });
    try {
      const storage = new WebStorageDriver();
      storage.prefs.set("console.ui", 1);
      expect(storage.prefs.get("console.ui")).toBe(1);
    } finally {
      Reflect.deleteProperty(globalThis, "localStorage");
    }
  });

  it("reports a quota error on flush", async () => {
    const { local } = stubWebStorage();
    local.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    const storage = new WebStorageDriver();
    storage.prefs.set("big", "x");
    expect(storage.prefs.get("big")).toBe("x");
    await expect(storage.flush()).rejects.toThrow("QuotaExceededError");
  });
});
