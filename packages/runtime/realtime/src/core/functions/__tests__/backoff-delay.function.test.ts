/**
 * Stackra file contract:
 * Purpose: unit tests of `backoffDelay`: doubling from one second, capped at `maxSeconds`, jittered within the upper
 *          half of the cap, and safe for a very large attempt count.
 * Boundary: test only; the jitter source is pinned.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0225 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { backoffDelay } from "#core/functions/backoff-delay.function";

/** A jitter source pinned to the top of the range. */
const top = () => 1;

describe("backoffDelay", () => {
  it("doubles from one second up to the cap", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map((attempt) => backoffDelay(attempt, 30, top))).toEqual([
      1000, 2000, 4000, 8000, 16_000, 30_000, 30_000,
    ]);
  });

  it("jitters within the upper half of the cap", () => {
    expect(backoffDelay(3, 30, () => 0)).toBe(4000);
    expect(backoffDelay(3, 30, () => 0.5)).toBe(6000);
    const delay = backoffDelay(10, 60);
    expect(delay).toBeGreaterThanOrEqual(30_000);
    expect(delay).toBeLessThanOrEqual(60_000);
  });

  it("stays finite for a huge attempt count", () => {
    expect(backoffDelay(5000, 60, () => 1)).toBe(60_000);
  });
});
