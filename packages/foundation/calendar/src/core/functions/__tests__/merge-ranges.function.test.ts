/**
 * Stackra file contract:
 * Purpose: unit tests of `mergeRanges`: sorting, merging touching and overlapping ranges, dropping empty ones, no mutation.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { mergeRanges } from "#core/functions/merge-ranges.function";

describe("mergeRanges", () => {
  it("sorts and merges", () => {
    const input: [number, number][] = [
      [10, 12],
      [5, 9],
      [0, 5],
      [11, 15],
      [20, 20],
    ];
    expect(mergeRanges(input)).toEqual([
      [0, 9],
      [10, 15],
    ]);
    expect(input[0]).toEqual([10, 12]);
  });
});
