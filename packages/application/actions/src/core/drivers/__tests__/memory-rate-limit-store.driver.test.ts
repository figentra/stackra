/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryRateLimitStoreDriver`: a new bucket starts full, empties after `capacity` takes,
 *          answers how long until the next token, refills with time up to its capacity, and keeps keys apart.
 * Boundary: test only; time is passed per take.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0217 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { RateLimitStore } from "#contracts/index";
import { MemoryRateLimitStoreDriver } from "#core/drivers/memory-rate-limit-store.driver";

const bucket = { capacity: 2, tokensPerSecond: 1 };
const at = (seconds: number) => new Date(seconds * 1000);

describe("MemoryRateLimitStoreDriver", () => {
  it("is a RateLimitStore", () => {
    expect(new MemoryRateLimitStoreDriver()).toBeInstanceOf(RateLimitStore);
  });

  it("allows capacity takes, then refuses with the wait", async () => {
    const store = new MemoryRateLimitStoreDriver();
    expect(await store.take("k", bucket, at(0))).toEqual({
      allowed: true,
      remaining: 1,
      retryAfterMs: 0,
    });
    expect(await store.take("k", bucket, at(0))).toEqual({
      allowed: true,
      remaining: 0,
      retryAfterMs: 0,
    });
    expect(await store.take("k", bucket, at(0))).toEqual({
      allowed: false,
      remaining: 0,
      retryAfterMs: 1000,
    });
  });

  it("refills with time, never above capacity", async () => {
    const store = new MemoryRateLimitStoreDriver();
    await store.take("k", bucket, at(0));
    await store.take("k", bucket, at(0));
    expect((await store.take("k", bucket, at(1))).allowed).toBe(true);
    expect((await store.take("k", bucket, at(100))).remaining).toBe(1);
  });

  it("keeps keys apart", async () => {
    const store = new MemoryRateLimitStoreDriver();
    const single = { capacity: 1, tokensPerSecond: 1 };
    await store.take("a", single, at(0));
    expect((await store.take("a", single, at(0))).allowed).toBe(false);
    expect((await store.take("b", single, at(0))).allowed).toBe(true);
  });
});
