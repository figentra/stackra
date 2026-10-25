/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpirePointsOutput`: a registered shape of whole, non-negative counts.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0328.
 */
import { describe, expect, it } from "@stackra/testing";

import { ExpirePointsOutput } from "#node/schemas/expire-points-output.schema";

describe("ExpirePointsOutput", () => {
  it("holds the accounts visited and the points removed", () => {
    expect({ ...ExpirePointsOutput.create({ accounts: 3, points: 120 }) }).toEqual({
      accounts: 3,
      points: 120,
    });
    expect(() => ExpirePointsOutput.create({ accounts: -1, points: 0 })).toThrow();
  });
});
