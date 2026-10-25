/**
 * Stackra file contract:
 * Purpose: unit tests of `PointsEarned`: the `points.earned` integration event at version 2, with the tier and the
 *          balance after, which refuses fractional points.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0141 (as amended); ADR 0305 (rule 21).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { PointsEarned } from "#node/events/points-earned.event";

const values = {
  memberId: "usr_1",
  points: 100,
  reference: "ord_1",
  tier: LoyaltyTier.Silver,
  balanceAfter: 1_100,
};

describe("PointsEarned", () => {
  it("is the points.earned integration event at version 2", () => {
    expect(kindOf(PointsEarned)?.options).toMatchObject({ name: "points.earned", version: 2 });
  });

  it("carries the tier and the balance after, in whole points", () => {
    expect({ ...PointsEarned.create(values) }).toEqual(values);
    expect(() => PointsEarned.create({ ...values, points: 1.5 })).toThrow();
  });
});
