/**
 * Stackra file contract:
 * Purpose: unit and type tests of `RateLimitConfig`: a configuration over `RateLimitOptions` keyed
 *          `actions.rate_limit`, built with its defaults, the template's commerce override (a public bucket spread over
 *          the base areas) and a runway values layer.
 * Boundary: test only; the override is the template's `services/commerce/src/config/rate-limit.config.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 19 and 20); ADR 0217 (decision 2).
 */
import { buildConfig, Config, configKey } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { RateLimitConfig } from "#config/rate-limit.config";
import { RATE_LIMIT_CONFIG_SCHEMA } from "#core/constants/rate-limit-config-schema.constant";

/** The template's override, under the plain name with the package class aliased. */
const BaseRateLimitConfig = RateLimitConfig;

/** A base instance whose areas the override spreads (tsc refuses `this.<field>` in its own initializer). */
const BASE = new BaseRateLimitConfig();

class CommerceRateLimitConfig extends BaseRateLimitConfig {
  override areas: RateLimitConfig["areas"] = {
    ...BASE.areas,
    public: { requests: 120, per: Duration.minutes(1), burst: 40 },
  };
}

describe("RateLimitConfig", () => {
  it("is a configuration keyed actions.rate_limit, an override inheriting the key", () => {
    expect(new RateLimitConfig()).toBeInstanceOf(Config);
    expect(configKey(RateLimitConfig, "actions")).toBe("actions.rate_limit");
    expect(configKey(CommerceRateLimitConfig, "actions")).toBe("actions.rate_limit");
  });

  it("types its fields on the class and builds with the defaults", () => {
    const config = buildConfig(RateLimitConfig);
    expectTypeOf(config.areas).toEqualTypeOf<
      Record<string, { requests: number; per: Duration; burst: number }>
    >();
    expect({ ...config }).toEqual(RATE_LIMIT_CONFIG_SCHEMA.parse({}));
  });

  it("applies the template's override over the base areas", () => {
    const config = buildConfig(CommerceRateLimitConfig);
    expect(config.areas["public"]).toEqual({ requests: 120, per: "PT1M", burst: 40 });
    expect(config.areas["app"]).toEqual({ requests: 600, per: "PT1M", burst: 100 });
  });

  it("takes a runway values layer", () => {
    const config = buildConfig(RateLimitConfig, {
      values: { areas: { app: { requests: 10, per: Duration.seconds(1), burst: 10 } } },
    });
    expect(config.areas["app"]).toEqual({ requests: 10, per: "PT1S", burst: 10 });
  });
});
