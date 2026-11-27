/**
 * Stackra file contract:
 * Purpose: unit tests of `CacheEdgeNonceStoreDriver`: it claims a request id through `Cache.add` under
 *          `EdgeNonceStore:<id>` for exactly the given seconds, so two instances over one shared store refuse each
 *          other's replays (one winner of concurrent claims), a claim is free again once it expires, and a cache that
 *          cannot add (no atomic set-if-absent) rejects the claim instead of answering it.
 * Boundary: test only; one `MemoryCacheDriver` stands in for the shared store two API instances reach (real Valkey and
 *           Postgres are the integration tests), on a settable clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0437 (decision 4 and Enforcement: a shared nonce store, `Cache.add`); ADR 0150.
 */
import { buildConfig } from "@stackra/config";
import {
  CacheConfig,
  CacheKey,
  MemoryCacheDriver,
  NoneCacheMetricsDriver,
  SharedCacheNamespaceDriver,
} from "@stackra/cache";
import { Cache } from "@stackra/cache/contracts";
import { Clock, Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { EdgeNonceStore } from "#contracts/ports/edge-nonce-store.port";
import { CacheEdgeNonceStoreDriver } from "#server/drivers/cache-edge-nonce-store.driver";

class ManualClock extends Clock {
  time = Date.parse("2026-11-26T09:00:00.000Z");

  now(): Date {
    return new Date(this.time);
  }
}

/** One cache store shared by the instances a test builds, on a settable clock. */
function sharedCache(): { cache: MemoryCacheDriver; clock: ManualClock } {
  const clock = new ManualClock();
  const cache = new MemoryCacheDriver(
    buildConfig(CacheConfig, { values: { jitter: 0.5 } }),
    new SharedCacheNamespaceDriver(),
    clock,
    new NoneCacheMetricsDriver(),
  );
  return { cache, clock };
}

describe("CacheEdgeNonceStoreDriver", () => {
  it("is a driver of the EdgeNonceStore port", () => {
    expect(new CacheEdgeNonceStoreDriver(sharedCache().cache)).toBeInstanceOf(EdgeNonceStore);
  });

  it("claims through Cache.add under the store's key, for exactly the given seconds", async () => {
    const { cache } = sharedCache();
    const add = vi.spyOn(cache, "add");
    await expect(new CacheEdgeNonceStoreDriver(cache).claim("req-1", 120)).resolves.toBe(true);
    expect(add).toHaveBeenCalledWith(
      CacheKey.of(EdgeNonceStore, "req-1"),
      true,
      Duration.seconds(120),
    );
    expect(String(add.mock.calls[0]?.[0])).toBe("EdgeNonceStore:req-1");
  });

  it("refuses a claim another instance made on the shared store: one winner of concurrent claims", async () => {
    const { cache } = sharedCache();
    const one = new CacheEdgeNonceStoreDriver(cache);
    const two = new CacheEdgeNonceStoreDriver(cache);
    await expect(one.claim("req-1", 120)).resolves.toBe(true);
    await expect(two.claim("req-1", 120)).resolves.toBe(false);
    const answers = await Promise.all(
      [one, two, one, two].map((store) => store.claim("req-2", 120)),
    );
    expect(answers.filter(Boolean)).toHaveLength(1);
  });

  it("keeps a claim its whole window, never shortened by the cache's jitter, and frees it after", async () => {
    const { cache, clock } = sharedCache();
    const nonces = new CacheEdgeNonceStoreDriver(cache);
    await nonces.claim("req-1", 120);
    clock.time += 119_999;
    await expect(nonces.claim("req-1", 120)).resolves.toBe(false);
    clock.time += 1;
    await expect(nonces.claim("req-1", 120)).resolves.toBe(true);
  });

  it("rejects the claim when the bound cache cannot add, never answering it", async () => {
    class NoAddCache extends Cache {
      get = vi.fn();

      put = vi.fn();

      remember = vi.fn();

      forget = vi.fn();

      forgetTag = vi.fn();
    }
    await expect(
      new CacheEdgeNonceStoreDriver(new NoAddCache()).claim("req-1", 120),
    ).rejects.toThrow("NoAddCache does not support add");
  });
});
