/**
 * Stackra file contract:
 * Purpose: unit tests of `PointsImported`: an integration event (`loyalty_kit.points.imported.v1`) of whole points, the
 *          tier after the import and the balance after; it is not `points.earned`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0141; ADR 0305 (rule 19); ADR 0454 (decision 4); STA-1323.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { PointsImported } from "#node/events/points-imported.event";

describe("PointsImported", () => {
  it("is the points.imported integration event of whole points", () => {
    expect(kindOf(PointsImported)?.options).toMatchObject({ name: "points.imported", version: 1 });
    const event = PointsImported.create({
      memberId: "usr_1",
      points: 1250,
      reference: "run_1:row_1",
      tier: LoyaltyTier.Silver,
      balanceAfter: 1250,
    });
    expect(event.tier).toBe(LoyaltyTier.Silver);
    expect(() =>
      PointsImported.create({
        memberId: "usr_1",
        points: 1.5,
        reference: "x",
        tier: LoyaltyTier.Bronze,
        balanceAfter: 0,
      }),
    ).toThrow();
  });
});
