/**
 * Stackra file contract:
 * Purpose: `RateLimitConfig`, the action pipeline's configuration (key `actions.rate_limit`): the token bucket of each
 *          API area, which the rate-limit step applies to every call before the action's own `rateLimit`.
 * Boundary: a configuration class over `RateLimitOptions` with no env map; runway's `config.actions.rate_limit` layer
 *           sets it per environment. A host overrides it as `class RateLimitConfig extends BaseRateLimitConfig` with
 *           `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0217 (decision 2).
 */
import { Config } from "@stackra/config";

import { RateLimitOptions } from "#core/schemas/rate-limit-options.schema";

/**
 * The pipeline's rate-limit configuration.
 *
 * @example
 * import { RateLimitConfig as BaseRateLimitConfig } from "@stackra/actions";
 *
 * export class RateLimitConfig extends BaseRateLimitConfig {
 *   override areas = { ...new BaseRateLimitConfig().areas, public: { requests: 120, per: Duration.minutes(1), burst: 40 } };
 * }
 */
export class RateLimitConfig extends Config({ schema: RateLimitOptions }) {}
