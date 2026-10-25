/**
 * Stackra file contract:
 * Purpose: unit tests of `RedeemPointsInput`: a registered shape that refuses zero points, more than one entry may
 *          move, an empty reference and a negative total.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0328.
 */
import { describe, expect, it } from "@stackra/testing";

import { MAX_POINTS_PER_ENTRY } from "#core/constants/max-points-per-entry.constant";
import { RedeemPointsInput } from "#node/schemas/redeem-points-input.schema";

describe("RedeemPointsInput", () => {
  const valid = { points: 300, reference: "ord_2", totalMinor: 10_000 };

  it("holds the points, the reference and the amount still to pay", () => {
    expect({ ...RedeemPointsInput.create(valid) }).toEqual(valid);
  });

  it("refuses values outside its bounds", () => {
    expect(() => RedeemPointsInput.create({ ...valid, points: 0 })).toThrow();
    expect(() =>
      RedeemPointsInput.create({ ...valid, points: MAX_POINTS_PER_ENTRY + 1 }),
    ).toThrow();
    expect(() => RedeemPointsInput.create({ ...valid, reference: "" })).toThrow();
    expect(() => RedeemPointsInput.create({ ...valid, totalMinor: -1 })).toThrow();
  });
});
