/**
 * Stackra file contract:
 * Purpose: unit tests of `PointsTakenBack`: an integration event (`loyalty_kit.points.taken_back.v1`) of whole points
 *          taken, the shortfall and the balance after.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0141; ADR 0305 (rule 19); ADR 0454 (decision 4); STA-1323.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { PointsTakenBack } from "#node/events/points-taken-back.event";

describe("PointsTakenBack", () => {
  it("is the points.taken_back integration event of whole points", () => {
    expect(kindOf(PointsTakenBack)?.options).toMatchObject({
      name: "points.taken_back",
      version: 1,
    });
    const event = PointsTakenBack.create({
      memberId: "usr_1",
      points: 30,
      shortfall: 20,
      reference: "rfd_1",
      balanceAfter: 0,
    });
    expect([event.points, event.shortfall]).toEqual([30, 20]);
    expect(() =>
      PointsTakenBack.create({
        memberId: "usr_1",
        points: 0,
        shortfall: 0,
        reference: "rfd_1",
        balanceAfter: 0,
      }),
    ).toThrow();
  });
});
