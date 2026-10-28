/**
 * Stackra file contract:
 * Purpose: unit tests of `Cached`: the lifetime is recorded for @stackra/database to read, and a zero lifetime is
 *          refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0150 (decision 5); data-layer gap ca5.
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { traitsOf } from "#core/functions/traits-of.function";
import { Cached } from "#core/traits/cached.trait";

class Product extends Model.with(Cached({ ttl: Duration.minutes(10) })) {}

describe("Cached", () => {
  it("records its lifetime", () => {
    const [record] = traitsOf(Product);
    expect(record?.name).toBe("cached");
    expect(record?.options).toEqual({ ttl: Duration.minutes(10) });
  });

  it("refuses a zero lifetime", () => {
    expect(() => Cached({ ttl: Duration.seconds(0) })).toThrow(TypeError);
  });
});
