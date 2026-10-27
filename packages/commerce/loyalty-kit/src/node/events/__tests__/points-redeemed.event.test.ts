/**
 * Stackra file contract:
 * Purpose: unit tests of `PointsRedeemed`: an integration event (`loyalty_kit.points.redeemed.v1`) of whole points with
 *          the balance after.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0141; ADR 0305 (rule 19); ADR 0454 (decision 4).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { PointsRedeemed } from "#node/events/points-redeemed.event";

describe("PointsRedeemed", () => {
  it("is the points.redeemed integration event of whole points", () => {
    expect(kindOf(PointsRedeemed)?.options).toMatchObject({ name: "points.redeemed", version: 1 });
    const event = PointsRedeemed.create({
      memberId: "usr_1",
      points: 300,
      reference: "ord_2",
      balanceAfter: 700,
    });
    expect([event.points, event.balanceAfter]).toEqual([300, 700]);
    expect(() =>
      PointsRedeemed.create({
        memberId: "usr_1",
        points: 0.5,
        reference: "ord_2",
        balanceAfter: 0,
      }),
    ).toThrow();
  });
});
