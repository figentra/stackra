/**
 * Stackra file contract:
 * Purpose: unit tests of `sampleScore`: the same key always scores the same, every score is in `[0, 1)`, and scores
 *          spread evenly enough that a rate keeps about that share of keys.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; analytics gap 6 (sampling).
 */
import { describe, expect, it } from "@stackra/testing";

import { sampleScore } from "#core/functions/sample-score.function";

describe(sampleScore, () => {
  it("scores a key the same every time, within [0, 1)", () => {
    const score = sampleScore("anon_01jb9x3k7m2c8q4w6e5r0t1y2z");
    expect(sampleScore("anon_01jb9x3k7m2c8q4w6e5r0t1y2z")).toBe(score);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThan(1);
    expect(sampleScore("")).toBeLessThan(1);
  });

  it("keeps about a rate's share of keys", () => {
    const keys = Array.from({ length: 10_000 }, (_, index) => `anon_${index}`);
    const kept = keys.filter((key) => sampleScore(key) < 0.25).length;
    expect(kept).toBeGreaterThan(2200);
    expect(kept).toBeLessThan(2800);
  });
});
