/**
 * Stackra file contract:
 * Purpose: `RateLimitOptions`, the shape of `RateLimitConfig`: one token bucket per API area (`public`, `app`, `admin`,
 *          `platform`), each with its refill (`requests` per `per`) and its size (`burst`); and `actionDefault`, the
 *          per-minute buckets of an action that declares no `rateLimit`, one per scope and one per client address.
 * Boundary: a shape class; it registers this package's own schema (`RATE_LIMIT_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(RateLimitConfig)` validates with no generated file. `areas` is replaced whole
 *           by a host override, which spreads the base value explicitly. Plan-sized buckets come later through
 *           entitlements (ADR 0217); these are the platform's defaults.
 * Runtime: isomorphic
 * Governing contract: ADR 0217 (decision 2: token buckets per area and tenant); ADR 0294 (decisions 19 and 26);
 *                     STA-1588 (the default action buckets).
 */
import { Duration } from "@stackra/contracts";
import { Field, registerSchemas, Schema } from "@stackra/validation";

import { RATE_LIMIT_CONFIG_SCHEMA } from "#core/constants/rate-limit-config-schema.constant";

/**
 * The pipeline's per-area rate limits.
 *
 * @example
 * export class RateLimitConfig extends BaseRateLimitConfig {
 *   override areas = { ...new BaseRateLimitConfig().areas, public: { requests: 120, per: Duration.minutes(1), burst: 40 } };
 * }
 */
export class RateLimitOptions extends Schema {
  /** API area code to its bucket; an area with no entry is not limited by area. */
  // reason: a record of inline buckets that a host override replaces whole; the shipped schema already says its rule
  @Field(RATE_LIMIT_CONFIG_SCHEMA.shape.areas)
  areas: Record<
    string,
    {
      /** Calls added to the bucket per `per`. */
      requests: number;
      /** The refill period. */
      per: Duration;
      /** The bucket's size: the most calls allowed at once. */
      burst: number;
    }
  > = {
    public: { requests: 60, per: Duration.minutes(1), burst: 20 },
    app: { requests: 600, per: Duration.minutes(1), burst: 100 },
    admin: { requests: 300, per: Duration.minutes(1), burst: 60 },
    platform: { requests: 120, per: Duration.minutes(1), burst: 30 },
  };

  /**
   * Calls per minute (also the most at once) each action allows one scope (`perScope`, the actor without a scope) and
   * one client address (`perAddress`) when it declares no `rateLimit` of its own; its own `rateLimit` replaces both.
   */
  // reason: one inline pair a host override replaces whole; the shipped schema already says its rule
  @Field(RATE_LIMIT_CONFIG_SCHEMA.shape.actionDefault)
  actionDefault: { perScope: number; perAddress: number } = { perScope: 1200, perAddress: 300 };
}

registerSchemas([[RateLimitOptions, RATE_LIMIT_CONFIG_SCHEMA]]);
