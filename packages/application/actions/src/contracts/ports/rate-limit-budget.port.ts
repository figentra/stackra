/**
 * Stackra file contract:
 * Purpose: the `RateLimitBudget` port: the plan-sized area bucket of one call's scope (ADR 0217 decision 2: token
 *          buckets per app and tenant, sized by the plan entitlements). The pipeline's rate-limit step asks it before
 *          the configured area bucket of `RateLimitConfig`.
 * Boundary: an abstract class that is its own token, keyed `actions.RateLimitBudget`. `@stackra/entitlements` binds it
 *           (`EntitlementRateLimitBudgetDriver`) over its `EntitlementSource`, reading the value entitlements (ADR
 *           0408) `rate_limit.<area>_per_minute` and `rate_limit.<area>_burst` for the call's scope; their numbers
 *           are plan catalogue data, never code here. An answer of `undefined` keeps the configured area bucket; an
 *           app that binds none uses `RateLimitConfig` alone. The bucket key is `area:<area>:<app>[:<scope>]` (the
 *           app is the origin's id, else the actor; STA-1477), so a plan change resizes the same bucket.
 * Runtime: isomorphic
 * Governing contract: ADR 0217 (decision 2); ADR 0382 (decisions 3 and 6: budgets are data); ADR 0408 (value
 *                     entitlements); STA-1277; STA-1477.
 */
import { Port } from "@stackra/contracts";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";
import type { RateLimitBucket } from "#contracts/types/rate-limit-bucket.type";

/**
 * Sizes a call's area bucket from its scope's plan.
 *
 * @example
 * export class PlanRateLimitBudgetDriver extends Driver(RateLimitBudget) {
 *   async areaBucket(call: CallDescriptor): Promise<RateLimitBucket | undefined> {
 *     const perMinute = await this.values.valueOf(ApiCallsPerMinuteEntitlement, call.scope?.id);
 *     return perMinute === undefined ? undefined : { capacity: perMinute, tokensPerSecond: perMinute / 60 };
 *   }
 * }
 */
export abstract class RateLimitBudget extends Port {
  /** Type-only port key, so `DriverName<RateLimitBudget>` narrows to this port's drivers. */
  declare readonly "~key": "actions.RateLimitBudget";

  /**
   * The area bucket for `call` (its `area` and scope), or `undefined` when the plan sets none and the configured
   * bucket applies.
   *
   * @throws Error when the plan cannot be read; the call fails, it is never let through unlimited.
   */
  abstract areaBucket(call: CallDescriptor): Promise<RateLimitBucket | undefined>;
}
