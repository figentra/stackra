/**
 * Stackra file contract:
 * Purpose: unit tests of `PointsExpired`: an integration event (`loyalty_kit.points.expired.v1`) of whole points, the
 *          cutoff and the balance after.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0141; ADR 0305 (rule 19); ADR 0454 (decision 4).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { PointsExpired } from "#node/events/points-expired.event";

describe("PointsExpired", () => {
  it("is the points.expired integration event of whole points", () => {
    expect(kindOf(PointsExpired)?.options).toMatchObject({ name: "points.expired", version: 1 });
    const event = PointsExpired.create({
      memberId: "usr_1",
      points: 30,
      cutoff: "2026-04-21T03:00:00.000Z",
      balanceAfter: 0,
    });
    expect(event.cutoff).toBe("2026-04-21T03:00:00.000Z");
    expect(() =>
      PointsExpired.create({ memberId: "usr_1", points: 1.5, cutoff: "x", balanceAfter: 0 }),
    ).toThrow();
  });
});
