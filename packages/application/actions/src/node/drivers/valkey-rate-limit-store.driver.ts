/**
 * Stackra file contract:
 * Purpose: the Valkey driver of the `RateLimitStore` port (driver name `valkey`): each bucket is one Valkey hash
 *          (`tokens`, `at`) refilled and taken in one script, so every instance of a service draws from the same
 *          bucket.
 * Boundary: the server is the `ACTIONS_VALKEY_URL` secret; every key is `actions.stores.valkey.keyPrefix` plus
 *           `rate:` plus the bucket key. The caller passes `now` (the pipeline's clock), as with the memory driver, so
 *           both refill the same way. A bucket expires once it would be full again, so idle buckets cost nothing. A
 *           command is retried once, then rejects.
 * Runtime: node
 * Governing contract: ADR 0217 (decision 2: limits enforced in the pipeline); ADR 0150 (the Valkey client); ADR 0173;
 *                     ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import Valkey from "iovalkey";

import { StoresConfig } from "#config/stores.config";
import { RateLimitStore } from "#contracts/ports/rate-limit-store.port";
import type { RateLimitBucket } from "#contracts/types/rate-limit-bucket.type";
import type { RateLimitDecision } from "#contracts/types/rate-limit-decision.type";

/**
 * KEYS[1] the bucket; ARGV capacity, tokens per second, now ms. Answers allowed (1/0), whole tokens left, and the wait
 * in ms (-1 when the bucket never refills).
 */
const TAKE = `
local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local state = redis.call('hmget', KEYS[1], 'tokens', 'at')
local tokens = tonumber(state[1]) or capacity
local at = tonumber(state[2]) or now
tokens = math.min(capacity, tokens + math.max(0, now - at) / 1000 * rate)
local allowed = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
end
redis.call('hset', KEYS[1], 'tokens', tostring(tokens), 'at', tostring(now))
if rate > 0 then
  redis.call('pexpire', KEYS[1], math.ceil((capacity - tokens) / rate * 1000) + 1000)
end
local wait = 0
if allowed == 0 then
  if rate > 0 then wait = math.ceil((1 - tokens) / rate * 1000) else wait = -1 end
end
return { allowed, math.floor(tokens), wait }`;

/**
 * Keeps token buckets in Valkey.
 *
 * @example
 * // runway.yaml (production): config.actions.stores: { rateLimit: valkey }
 * const decision = await store.take("area:app:ten_1", { capacity: 20, tokensPerSecond: 1 }, now);
 */
export class ValkeyRateLimitStoreDriver extends Driver(RateLimitStore) {
  /** The client every call goes through. */
  readonly client: Valkey;

  private readonly prefix: string;

  /**
   * @param config - the server (`valkeyUrl`, the `ACTIONS_VALKEY_URL` secret) and the key prefix.
   * @throws TypeError when the `ACTIONS_VALKEY_URL` secret is not set.
   */
  constructor(config: StoresConfig) {
    super();
    if (config.valkeyUrl === "")
      throw new TypeError(
        "The valkey rate-limit store needs a server: set the ACTIONS_VALKEY_URL secret",
      );
    this.prefix = `${config.valkey.keyPrefix}rate:`;
    this.client = new Valkey(config.valkeyUrl, { maxRetriesPerRequest: 1 });
  }

  /** See `RateLimitStore.take`. */
  async take(key: string, bucket: RateLimitBucket, now: Date): Promise<RateLimitDecision> {
    const answer = (await this.client.eval(
      TAKE,
      1,
      this.prefix + key,
      String(bucket.capacity),
      String(bucket.tokensPerSecond),
      String(now.getTime()),
    )) as readonly [number, number, number];
    const [allowed, remaining, wait] = answer.map(Number) as [number, number, number];
    return {
      allowed: allowed === 1,
      remaining: allowed === 1 ? remaining : 0,
      retryAfterMs: wait < 0 ? Infinity : wait,
    };
  }
}
