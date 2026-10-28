/**
 * Stackra file contract:
 * Purpose: `EntitlementRateLimitBudgetDriver`, the driver of the action pipeline's `RateLimitBudget`: it sizes a
 *          call's area bucket from two value entitlements of the call's scope plan, `rate_limit.<area>_per_minute`
 *          (the refill) and `rate_limit.<area>_burst` (the capacity, the per-minute value when the plan sets none).
 * Boundary: reads the bound `EntitlementSource` by key, in the call's scope (`call.scope`, platform-wide without one),
 *           so every number is plan catalogue data (plan, add-ons, overrides) and none is in code. A plan that sets no
 *           per-minute value answers `undefined`, and the pipeline keeps the configured `RateLimitConfig` bucket. A
 *           grant that is not a number of zero or more is a source bug and throws a `TypeError`, never a guessed or
 *           unlimited bucket.
 * Runtime: isomorphic
 * Governing contract: ADR 0217 (decision 2: token buckets sized by the plan entitlements); ADR 0408 (value
 *                     entitlements); ADR 0215 (decision 5); STA-1477.
 */
import {
  type CallDescriptor,
  RateLimitBudget,
  type RateLimitBucket,
} from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";

import { isValueGrant } from "#core/functions/is-value-grant.function";
import type { EntitlementSource } from "#core/ports/entitlement-source.port";

/**
 * Sizes the area bucket from the scope's plan.
 *
 * @example
 * const budget = new EntitlementRateLimitBudgetDriver(source);
 * await budget.areaBucket(call); // { capacity: 40, tokensPerSecond: 2 } for a plan of 120 a minute, burst 40
 */
export class EntitlementRateLimitBudgetDriver extends Driver(RateLimitBudget) {
  /** Where grants come from. */
  private readonly source: EntitlementSource;

  /**
   * @param source - the plan service's snapshot or the licence.
   */
  constructor(source: EntitlementSource) {
    super();
    this.source = source;
  }

  /**
   * The bucket the scope's plan sets for the call's area, or `undefined` when it sets no per-minute value.
   *
   * @throws TypeError when a grant is not a number of zero or more.
   * @throws Error when the source cannot be reached; the call fails, it is never let through unlimited.
   */
  async areaBucket(call: CallDescriptor): Promise<RateLimitBucket | undefined> {
    const perMinute = await this.value(`rate_limit.${call.area}_per_minute`, call);
    if (perMinute === undefined) return undefined;
    const burst = await this.value(`rate_limit.${call.area}_burst`, call);
    return { capacity: burst ?? perMinute, tokensPerSecond: perMinute / 60 };
  }

  /** The value grant under `key` in the call's scope, checked. */
  private async value(key: string, call: CallDescriptor): Promise<number | undefined> {
    const grant = await this.source.grant(key, call.scope?.id);
    if (grant === undefined) return undefined;
    if (!isValueGrant(grant))
      throw new TypeError(
        `${key} is a value, so its source answers a number, not ${JSON.stringify(grant)}`,
      );
    return grant;
  }
}
