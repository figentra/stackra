/**
 * Stackra file contract:
 * Purpose: unit tests of `TenantKeyCache`: an entry is served until it expires, a load in flight is shared, a failed
 *          load is not kept, the least recently used tenant leaves first past the bound, and `forget` drops a tenant.
 * Boundary: test only; the clock is a counter.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0188 (2026-11-09 amendment, point 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { TenantKeyCache } from "#core/values/tenant-key-cache.value";

describe(TenantKeyCache, () => {
  it("serves an entry until it expires, sharing a load in flight", async () => {
    let now = 0;
    let loads = 0;
    const cache = new TenantKeyCache<number>(10, 5, () => now);
    const load = async () => (loads += 1);
    const [first, second] = await Promise.all([cache.get("a", load), cache.get("a", load)]);
    expect([first, second, loads]).toEqual([1, 1, 1]);
    now = 9999;
    expect(await cache.get("a", load)).toBe(1);
    now = 10_000;
    expect(await cache.get("a", load)).toBe(2);
  });

  it("keeps no failed load, evicts the least recently used past the bound, and forgets on demand", async () => {
    const cache = new TenantKeyCache<string>(60, 2, () => 0);
    await expect(cache.get("a", () => Promise.reject(new Error("down")))).rejects.toThrow("down");
    expect(await cache.get("a", async () => "a1")).toBe("a1");
    await cache.get("b", async () => "b1");
    await cache.get("a", async () => "unused");
    await cache.get("c", async () => "c1");
    // b was the least recently used of a and b, so c pushed it out
    expect(await cache.get("b", async () => "b2")).toBe("b2");
    expect(await cache.get("c", async () => "unused")).toBe("c1");
    cache.forget("c");
    expect(await cache.get("c", async () => "c2")).toBe("c2");
  });
});
