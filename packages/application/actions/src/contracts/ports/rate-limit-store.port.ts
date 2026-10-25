/**
 * Stackra file contract:
 * Purpose: the `RateLimitStore` port: the token buckets of the pipeline's rate-limit step, one per API area and caller
 *          and one per rate-limited action and caller.
 * Boundary: an abstract class that is its own token. This package ships the memory driver (one process); a shared
 *           driver for several instances comes with a shared store. `take` is atomic per key.
 * Runtime: isomorphic
 * Governing contract: ADR 0217 (decision 2: token buckets, enforced at the edge and in the pipeline).
 */
import { Port } from "@stackra/contracts";

import type { RateLimitBucket } from "#contracts/types/rate-limit-bucket.type";
import type { RateLimitDecision } from "#contracts/types/rate-limit-decision.type";

/**
 * Holds token buckets.
 *
 * @example
 * const decision = await store.take("orders.order.create@1:principal:usr_1", { capacity: 20, tokensPerSecond: 1 / 3 }, now);
 * if (!decision.allowed) throw RateLimitedError.create();
 */
export abstract class RateLimitStore extends Port {
  /** Type-only port key, so `DriverName<RateLimitStore>` narrows to this port's drivers. */
  declare readonly "~key": "actions.RateLimitStore";

  /** Refills the bucket under `key` (created full) to `now`, then takes one token when one is there. */
  abstract take(key: string, bucket: RateLimitBucket, now: Date): Promise<RateLimitDecision>;
}
