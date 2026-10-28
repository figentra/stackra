/**
 * Stackra file contract:
 * Purpose: unit tests of `groupingMask`: the full grouping is 0, the grand total sets every bit, and the first
 *          dimension is the most significant bit, as Postgres `grouping()` counts.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0470 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { groupingMask } from "#node/functions/grouping-mask.function";

describe(groupingMask, () => {
  it("sets one bit per dimension left out, the first one highest", () => {
    const dimensions = ["region", "status", "channel"];
    expect(groupingMask(dimensions, dimensions)).toBe(0);
    expect(groupingMask(dimensions, ["region", "status"])).toBe(1);
    expect(groupingMask(dimensions, ["region"])).toBe(3);
    expect(groupingMask(dimensions, ["status", "channel"])).toBe(4);
    expect(groupingMask(dimensions, [])).toBe(7);
  });
});
