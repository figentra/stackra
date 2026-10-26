/**
 * Stackra file contract:
 * Purpose: unit tests of `isValueGrant`: zero, a positive number and infinity are value grants; a negative number,
 *          NaN, a boolean and a soft limit are not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0408; STA-824.
 */
import { describe, expect, it } from "@stackra/testing";

import { isValueGrant } from "#core/functions/is-value-grant.function";

describe(isValueGrant, () => {
  it("takes a number of zero or more", () => {
    expect([0, 90, Number.POSITIVE_INFINITY].map(isValueGrant)).toEqual([true, true, true]);
  });

  it("refuses anything else", () => {
    expect([-1, Number.NaN, true, { limit: 2 }, "90"].map(isValueGrant)).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);
  });
});
