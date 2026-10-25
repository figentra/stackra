/**
 * Stackra file contract:
 * Purpose: unit tests of `limitAllows`, `isLimitGrant` and `limitOf`: a count is a hard limit; a soft limit passes
 *          below its allowance, past it only while the grace runs and below the ceiling; malformed grants are not
 *          limit grants; the allowance a refusal names.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0215 (decisions 3 and 4); owner round 3 #18.
 */
import { describe, expect, it } from "@stackra/testing";

import { isLimitGrant } from "#core/functions/is-limit-grant.function";
import { limitAllows } from "#core/functions/limit-allows.function";
import { limitOf } from "#core/functions/limit-of.function";

const NOW = new Date("2026-10-25T09:00:00Z");
const LATER = new Date("2026-11-01T00:00:00Z");
const EARLIER = new Date("2026-10-01T00:00:00Z");

describe("limitAllows", () => {
  it("treats a count as a hard limit", () => {
    expect(limitAllows(2, 1, NOW)).toBe(true);
    expect(limitAllows(2, 2, NOW)).toBe(false);
    expect(limitAllows(Number.POSITIVE_INFINITY, 1e9, NOW)).toBe(true);
  });

  it("lets a soft limit pass past its allowance only during grace and below the ceiling", () => {
    expect(limitAllows({ limit: 2 }, 2, NOW)).toBe(false);
    expect(limitAllows({ limit: 2, graceEndsAt: LATER }, 5, NOW)).toBe(true);
    expect(limitAllows({ limit: 2, graceEndsAt: LATER, ceiling: 3 }, 3, NOW)).toBe(false);
    expect(limitAllows({ limit: 2, graceEndsAt: EARLIER }, 2, NOW)).toBe(false);
    expect(limitAllows({ limit: 2, graceEndsAt: NOW }, 2, NOW)).toBe(false);
  });
});

describe("isLimitGrant", () => {
  it("accepts counts and well-formed soft limits", () => {
    expect(isLimitGrant(0)).toBe(true);
    expect(isLimitGrant(Number.POSITIVE_INFINITY)).toBe(true);
    expect(isLimitGrant({ limit: 2, graceEndsAt: LATER, ceiling: 4 })).toBe(true);
  });

  it("refuses anything else", () => {
    for (const grant of [true, -1, Number.NaN, null, {}, { limit: "2" }, { limit: 2, ceiling: -1 }])
      expect(isLimitGrant(grant)).toBe(false);
    expect(isLimitGrant({ limit: 2, graceEndsAt: new Date("nope") })).toBe(false);
  });
});

describe("limitOf", () => {
  it("names a count or a soft limit's allowance", () => {
    expect(limitOf(3)).toBe(3);
    expect(limitOf({ limit: 5, ceiling: 7 })).toBe(5);
  });
});
