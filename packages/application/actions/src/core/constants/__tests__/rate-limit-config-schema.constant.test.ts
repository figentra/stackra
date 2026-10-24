/**
 * Stackra file contract:
 * Purpose: unit tests of `RATE_LIMIT_CONFIG_SCHEMA` (`RateLimitConfig$`): `.parse({})` gives the default buckets equal
 *          to `RateLimitOptions`' initializers, `per` is normalised to a canonical duration, bad buckets are refused,
 *          and a host's generated schema extends it the way the template's commerce schema does.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26).
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { duration } from "@stackra/validation";

import { RATE_LIMIT_CONFIG_SCHEMA } from "#core/constants/rate-limit-config-schema.constant";
import { RateLimitOptions } from "#core/schemas/rate-limit-options.schema";

describe("RATE_LIMIT_CONFIG_SCHEMA", () => {
  it("defaults every area like RateLimitOptions", () => {
    expect(RATE_LIMIT_CONFIG_SCHEMA.parse({})).toEqual({ areas: new RateLimitOptions().areas });
    expect(RATE_LIMIT_CONFIG_SCHEMA.shape.areas.parse(undefined)).toEqual(
      new RateLimitOptions().areas,
    );
  });

  it("normalises per and refuses a bad bucket", () => {
    const parsed = RATE_LIMIT_CONFIG_SCHEMA.parse({
      areas: { app: { requests: 10, per: "PT60S", burst: 5 } },
    });
    expect(parsed.areas["app"]?.per).toBe(Duration.minutes(1));
    expect(() =>
      RATE_LIMIT_CONFIG_SCHEMA.parse({ areas: { app: { requests: 0, per: "PT1M", burst: 1 } } }),
    ).toThrow();
    expect(() =>
      RATE_LIMIT_CONFIG_SCHEMA.parse({ areas: { app: { requests: 1, per: "soon", burst: 1 } } }),
    ).toThrow();
  });

  it("is extended by a host's generated schema", () => {
    const Host$ = RATE_LIMIT_CONFIG_SCHEMA.extend({
      areas: RATE_LIMIT_CONFIG_SCHEMA.shape.areas.unwrap().default(() => ({
        ...RATE_LIMIT_CONFIG_SCHEMA.shape.areas.parse(undefined),
        public: { requests: 120, per: duration("1m"), burst: 40 },
      })),
    });
    expect(Host$.parse({}).areas["public"]).toEqual({
      requests: 120,
      per: Duration.minutes(1),
      burst: 40,
    });
    expect(Host$.parse({}).areas["app"]).toEqual(new RateLimitOptions().areas["app"]);
  });
});
