/**
 * Stackra file contract:
 * Purpose: unit tests of `checkVector`: a non-empty vector of finite numbers passes; an empty one, a NaN, an infinity
 *          or a value that is not a number is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; owner decision 23.
 */
import { describe, expect, it } from "@stackra/testing";

import { checkVector } from "#core/functions/check-vector.function";

describe(checkVector, () => {
  it("passes finite numbers", () => {
    expect(() => checkVector([0.12, -0.4, 0])).not.toThrow();
  });

  it("refuses an empty vector and values that are not finite numbers", () => {
    expect(() => checkVector([])).toThrow(TypeError);
    expect(() => checkVector([0.1, Number.NaN])).toThrow(TypeError);
    expect(() => checkVector([Number.POSITIVE_INFINITY])).toThrow(TypeError);
    expect(() => checkVector(["0.1"] as unknown as number[])).toThrow(TypeError);
  });
});
