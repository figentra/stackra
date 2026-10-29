/**
 * Stackra file contract:
 * Purpose: unit tests of `StoredCacheDriver`: a subclass is a `Cache` whose five port methods answer from
 *          `storedCache` over the store, namespace, clock and settings it passes to `super`.
 * Boundary: test only; a test-local subclass passes a memory entry store, as a driver would.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0150 (decisions 1, 2
 *                     and 4).
 */
import { Clock, Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Cache } from "#contracts/ports/cache.port";
import { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import { CacheKey } from "#core/constants/cache-key.constant";
import { StoredCacheDriver } from "#core/drivers/stored-cache.driver";
import { memoryEntryStore } from "#core/functions/memory-entry-store.function";

class ManualClock extends Clock {
  time = Date.parse("2026-10-24T09:00:00.000Z");

  now(): Date {
    return new Date(this.time);
  }
}

class FixedCacheNamespace extends CacheNamespace {
  current(): string {
    return "";
  }
}

/** A driver over process memory. */
class TestCacheDriver extends StoredCacheDriver<Cache> {
  constructor(clock: Clock) {
    super(memoryEntryStore(100, clock), new FixedCacheNamespace(), clock, {});
  }
}

class Product {}

class Category {}

describe("StoredCacheDriver", () => {
  it("is a Cache whose calls answer from the store it was given", async () => {
    const cache = new TestCacheDriver(new ManualClock());
    expect(cache).toBeInstanceOf(Cache);
    const key = CacheKey.of(Product, "prd_1");
    const tag = CacheKey.of(Category, "cat_1");
    await cache.put(key, 1, Duration.minutes(1), { tags: [tag] });
    await expect(cache.get(key)).resolves.toBe(1);
    await expect(cache.remember(key, Duration.minutes(1), () => 2)).resolves.toBe(1);
    await cache.forgetTag(tag);
    await expect(cache.get(key)).resolves.toBeUndefined();
    await expect(cache.remember(key, Duration.minutes(1), () => 3)).resolves.toBe(3);
    await cache.forget(key);
    await expect(cache.get(key)).resolves.toBeUndefined();
  });
});
