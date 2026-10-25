/**
 * Stackra file contract:
 * Purpose: `MemoryRateLimitStoreDriver`, the in-process `RateLimitStore`: one token bucket per key, refilled lazily on
 *          each take from the time since the last one.
 * Boundary: one process only, so limits are per instance; a deployment with several instances binds a shared driver.
 *           `take` never awaits between the read and the write, so it is atomic. Time comes from the caller (the
 *           pipeline's frozen clock), so a test moves time by passing it.
 * Runtime: isomorphic
 * Governing contract: ADR 0217 (decision 2: token buckets).
 */
import { Driver } from "@stackra/container";

import { RateLimitStore } from "#contracts/ports/rate-limit-store.port";
import type { RateLimitBucket } from "#contracts/types/rate-limit-bucket.type";
import type { RateLimitDecision } from "#contracts/types/rate-limit-decision.type";

/** A bucket's tokens at the time of its last take (epoch milliseconds). */
type State = { tokens: number; at: number };

/**
 * Token buckets in memory.
 *
 * @example
 * const store = new MemoryRateLimitStoreDriver();
 * await store.take("area:public:usr_1", { capacity: 20, tokensPerSecond: 1 }, new Date()); // { allowed: true, ... }
 */
export class MemoryRateLimitStoreDriver extends Driver(RateLimitStore) {
  /** Key to its bucket's state. */
  private readonly buckets = new Map<string, State>();

  /** Refills the bucket to `now`, then takes one token when a whole one is there. */
  async take(key: string, bucket: RateLimitBucket, now: Date): Promise<RateLimitDecision> {
    const time = now.getTime();
    const state = this.buckets.get(key) ?? { tokens: bucket.capacity, at: time };
    const elapsed = Math.max(0, time - state.at) / 1000;
    const tokens = Math.min(bucket.capacity, state.tokens + elapsed * bucket.tokensPerSecond);
    if (tokens >= 1) {
      this.buckets.set(key, { tokens: tokens - 1, at: time });
      return { allowed: true, remaining: Math.floor(tokens - 1), retryAfterMs: 0 };
    }
    this.buckets.set(key, { tokens, at: time });
    const retryAfterMs =
      bucket.tokensPerSecond > 0
        ? Math.ceil(((1 - tokens) / bucket.tokensPerSecond) * 1000)
        : Infinity;
    return { allowed: false, remaining: 0, retryAfterMs };
  }
}
