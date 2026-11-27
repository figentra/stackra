/**
 * Stackra file contract:
 * Purpose: unit tests of `percentile` and `summariseLatencies`: nearest-rank percentiles, an empty list, a bad
 *          percentile, and a summary that counts failures and keeps the first message.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 4); STA-317.
 */
import { describe, expect, it } from "@stackra/testing";

import { percentile } from "#node/latency/percentile.function";
import { summariseLatencies } from "#node/latency/summarise-latencies.function";

describe("percentile", () => {
  it("takes the nearest rank of a sorted list", () => {
    const hundred = Array.from({ length: 100 }, (_, index) => index + 1);
    expect(percentile(hundred, 50)).toBe(50);
    expect(percentile(hundred, 95)).toBe(95);
    expect(percentile(hundred, 99)).toBe(99);
    expect(percentile(hundred, 100)).toBe(100);
    expect(percentile(hundred, 0)).toBe(1);
    expect(percentile([7], 99)).toBe(7);
  });

  it("answers 0 for no values and refuses a percentile outside 0 to 100", () => {
    expect(percentile([], 95)).toBe(0);
    expect(() => percentile([1], 101)).toThrow(RangeError);
    expect(() => percentile([1], Number.NaN)).toThrow(RangeError);
  });
});

describe("summariseLatencies", () => {
  it("sorts the run times, rounds each figure and counts the failures", () => {
    const summary = summariseLatencies([4.123456, 1, 3, 2], { count: 2, first: "pool exhausted" });
    expect(summary).toEqual({
      served: 4,
      failed: 2,
      firstError: "pool exhausted",
      p50: 2,
      p95: 4.123,
      p99: 4.123,
      max: 4.123,
    });
  });

  it("reports zeros and no message for a scenario that never ran", () => {
    expect(summariseLatencies([], { count: 0 })).toEqual({
      served: 0,
      failed: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      max: 0,
    });
  });
});
