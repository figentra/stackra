/**
 * Stackra file contract:
 * Purpose: unit tests of `PointsEarnedV1Change`: an event change from version 1 with its sunset; `up` lifts a v1
 *          payload to v2 at bronze with the credit as the balance, and `down` keeps only the v1 fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0141; ADR 0131 (sunset); ADR 0305 (rule 21).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { PointsEarnedV1Change } from "#node/events/points-earned-v1.change";
import { PointsEarned } from "#node/events/points-earned.event";

describe("PointsEarnedV1Change", () => {
  it("is a change from version 1 until its sunset", () => {
    expect(kindOf(PointsEarnedV1Change)?.options).toEqual({ from: 1, sunset: "2027-04-01" });
  });

  it("lifts a v1 payload to v2 and lowers a v2 payload to v1", () => {
    const change = PointsEarnedV1Change.create({
      memberId: "usr_1",
      points: 40,
      reference: "ord_1",
    });

    const v2 = change.up(change);
    expect(v2).toBeInstanceOf(PointsEarned);
    expect({ ...v2 }).toEqual({
      memberId: "usr_1",
      points: 40,
      reference: "ord_1",
      tier: LoyaltyTier.Bronze,
      balanceAfter: 40,
    });

    const v1 = change.down(
      PointsEarned.create({
        memberId: "usr_1",
        points: 40,
        reference: "ord_1",
        tier: LoyaltyTier.Gold,
        balanceAfter: 900,
      }),
    );
    expect({ ...v1 }).toEqual({ memberId: "usr_1", points: 40, reference: "ord_1" });
  });
});
