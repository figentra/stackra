/**
 * Stackra file contract:
 * Purpose: unit and type tests of `DomainEvent`: a bare-only kind base registered as `domain_event` with no options,
 *          an `Event`, with no called form.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rule 19); ADR 0294 (amendment item 5).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { DomainEvent } from "#core/bases/domain-event.base";
import { Event } from "#core/bases/event.base";

class PointsRedeemed extends DomainEvent {
  points!: number;
}

describe("DomainEvent", () => {
  it("is the domain_event kind with no options", () => {
    expect(kindOf(DomainEvent)).toEqual({ kind: "domain_event", options: {} });
    expect(kindOf(PointsRedeemed)).toEqual({ kind: "domain_event", options: {} });
  });

  it("is an Event", () => {
    expect(PointsRedeemed.prototype).toBeInstanceOf(Event);
    expect(PointsRedeemed.create).toBe(Event.create);
  });

  it("has no called form", () => {
    // @ts-expect-error -- a domain event takes no options
    expect(() => DomainEvent({ name: "points.redeemed" })).toThrow(TypeError);
  });
});
