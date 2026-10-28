/**
 * Stackra file contract:
 * Purpose: unit tests of `poolConfig`: a pool becomes MikroORM's `min`, `max` and `idleTimeoutMillis`, a missing field
 *          stays out, and a pool that cannot serve a query is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0473 (decision 2).
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { poolConfig } from "#core/functions/pool-config.function";

describe("poolConfig", () => {
  it("maps a whole pool and leaves out what is not set", () => {
    expect(poolConfig({ max: 4, min: 1, idleTimeout: Duration.seconds(30) })).toEqual({
      max: 4,
      min: 1,
      idleTimeoutMillis: 30_000,
    });
    expect(poolConfig({ max: 3 })).toEqual({ max: 3 });
    expect(poolConfig({})).toEqual({});
  });

  it("refuses a pool that cannot serve a query", () => {
    expect(() => poolConfig({ max: 0 })).toThrow(RangeError);
    expect(() => poolConfig({ max: 2.5 })).toThrow(RangeError);
    expect(() => poolConfig({ max: 2, min: 3 })).toThrow(RangeError);
    expect(() => poolConfig({ min: -1 })).toThrow(RangeError);
  });
});
