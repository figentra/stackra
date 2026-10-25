/**
 * Stackra file contract:
 * Purpose: unit tests of `PointsIssuedView`: a registered shape of whole points earned and redeemed today.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0328.
 */
import { describe, expect, it } from "@stackra/testing";

import { PointsIssuedView } from "#core/schemas/points-issued-view.schema";

describe("PointsIssuedView", () => {
  it("holds today's earned and redeemed points", () => {
    expect({ ...PointsIssuedView.create({ earned: 420, redeemed: 60 }) }).toEqual({
      earned: 420,
      redeemed: 60,
    });
  });

  it("refuses a fractional count", () => {
    expect(() => PointsIssuedView.create({ earned: 1.5, redeemed: 0 })).toThrow();
  });
});
