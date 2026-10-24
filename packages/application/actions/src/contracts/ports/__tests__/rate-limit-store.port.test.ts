/**
 * Stackra file contract:
 * Purpose: unit tests of the `RateLimitStore` port: it is an abstract `Port` (its own token, never built directly) and
 *          a driver answers a take with a decision.
 * Boundary: test only; the driver here is a stand-in for the implementing package's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (ports).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { RateLimitBucket } from "#contracts/types/rate-limit-bucket.type";
import type { RateLimitDecision } from "#contracts/types/rate-limit-decision.type";
import { RateLimitStore } from "#contracts/ports/rate-limit-store.port";

class CountingDriver extends Driver(RateLimitStore) {
  private readonly counts = new Map<string, number>();

  async take(key: string, bucket: RateLimitBucket, _now: Date): Promise<RateLimitDecision> {
    const used = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, used);
    const allowed = used <= bucket.capacity;
    return {
      allowed,
      remaining: Math.max(0, bucket.capacity - used),
      retryAfterMs: allowed ? 0 : 1000,
    };
  }
}

describe("RateLimitStore", () => {
  it("is an abstract port", () => {
    expect(RateLimitStore.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver", async () => {
    const driver = new CountingDriver();
    const bucket = { capacity: 1, tokensPerSecond: 1 };
    expect(await driver.take("k", bucket, new Date(0))).toEqual({
      allowed: true,
      remaining: 0,
      retryAfterMs: 0,
    });
    expect((await driver.take("k", bucket, new Date(0))).allowed).toBe(false);
  });
});
