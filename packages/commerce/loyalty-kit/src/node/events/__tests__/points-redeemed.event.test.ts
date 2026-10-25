/**
 * Stackra file contract:
 * Purpose: unit tests of `PointsRedeemed`: a domain event (never versioned, never in the outbox) of whole points.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0141 (private events); ADR 0305 (rule 19).
 */
import { DomainEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";

import { PointsRedeemed } from "#node/events/points-redeemed.event";

describe("PointsRedeemed", () => {
  it("is a domain event of whole points", () => {
    const event = PointsRedeemed.create({ memberId: "usr_1", points: 300, reference: "ord_2" });
    expect(event).toBeInstanceOf(DomainEvent);
    expect(event.points).toBe(300);
    expect(() =>
      PointsRedeemed.create({ memberId: "usr_1", points: 0.5, reference: "ord_2" }),
    ).toThrow();
  });
});
