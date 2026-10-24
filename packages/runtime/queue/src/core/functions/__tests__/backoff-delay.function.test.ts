/**
 * Stackra file contract:
 * Purpose: unit tests of `backoffDelay`: the ten-second step per code, the jitter of up to half a step, the one-hour
 *          cap, and the refusal of a bad attempt number or code.
 * Boundary: test only; the jitter is pinned with a fixed `random`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decision 1: backoff and jitter).
 */
import { describe, expect, it } from "@stackra/testing";

import { Backoff } from "#core/enums/backoff.enum";
import { backoffDelay } from "#core/functions/backoff-delay.function";

const none = () => 0;

describe(backoffDelay, () => {
  it("doubles from ten seconds for exponential", () => {
    expect([1, 2, 3, 4].map((attempt) => backoffDelay(Backoff.Exponential, attempt, none))).toEqual(
      [10_000, 20_000, 40_000, 80_000],
    );
  });

  it("grows by ten seconds for linear and stays at ten for fixed", () => {
    expect(backoffDelay(Backoff.Linear, 3, none)).toBe(30_000);
    expect(backoffDelay(Backoff.Fixed, 3, none)).toBe(10_000);
  });

  it("adds up to half a step of jitter", () => {
    expect(backoffDelay(Backoff.Fixed, 1, () => 0.5)).toBe(12_500);
    for (let index = 0; index < 50; index++) {
      const wait = backoffDelay(Backoff.Exponential, 2);
      expect(wait).toBeGreaterThanOrEqual(20_000);
      expect(wait).toBeLessThanOrEqual(30_000);
    }
  });

  it("never waits more than an hour", () => {
    expect(backoffDelay(Backoff.Exponential, 40, none)).toBe(3_600_000);
    expect(backoffDelay(Backoff.Linear, 1_000, () => 0.9)).toBe(3_600_000);
  });

  it("refuses an attempt that is not a whole number from 1, and an unknown code", () => {
    expect(() => backoffDelay(Backoff.Fixed, 0)).toThrow(RangeError);
    expect(() => backoffDelay(Backoff.Fixed, 1.5)).toThrow(RangeError);
    expect(() => backoffDelay("random" as Backoff, 1)).toThrow(RangeError);
  });
});
