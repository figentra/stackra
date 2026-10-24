/**
 * Stackra file contract:
 * Purpose: unit and type tests of `RateLimitOptions`: a shape with one default bucket per API area, typed with a
 *          `Duration` refill period, whose shipped schema is registered for `validate`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0217 (decision 2); ADR 0294 (decision 26).
 */
import { ApiArea, type Duration, Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { validate } from "@stackra/validation";

import { RateLimitOptions } from "#core/schemas/rate-limit-options.schema";

describe("RateLimitOptions", () => {
  it("has a bucket for every API area", () => {
    expect(Object.keys(new RateLimitOptions().areas).sort()).toEqual(Enum.values(ApiArea).sort());
    expect(new RateLimitOptions().areas["public"]).toEqual({
      requests: 60,
      per: "PT1M",
      burst: 20,
    });
  });

  it("validates through its registered schema", () => {
    const result = validate(RateLimitOptions, {
      areas: { app: { requests: 5, per: "PT10S", burst: 5 } },
    });
    expect(result.success).toBe(true);
    expect(
      validate(RateLimitOptions, { areas: { app: { requests: -1, per: "PT10S", burst: 5 } } })
        .success,
    ).toBe(false);
  });

  it("types the refill period as a Duration", () => {
    expectTypeOf<RateLimitOptions["areas"][string]["per"]>().toEqualTypeOf<Duration>();
  });
});
