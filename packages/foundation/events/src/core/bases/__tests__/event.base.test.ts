/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Event`: `X.create(fields)` parses through the registered schema (defaults applied,
 *          rules checked), returns a frozen instance of the calling class without running its constructor, throws for
 *          a class with no schema, and types its argument as the payload fields without the brand.
 * Boundary: test only; registers zod schemas the way gen's generated schemas file does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 26
 *                     and 27).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import type { Fields } from "@stackra/validation";
import { z } from "zod";

import { DomainEvent } from "#core/bases/domain-event.base";
import { Event } from "#core/bases/event.base";

class PointsRedeemed extends DomainEvent {
  memberId!: string;

  points!: number;

  reference = "manual";
}

class Unregistered extends DomainEvent {
  memberId!: string;
}

registerSchemas([
  [
    PointsRedeemed,
    z.object({
      memberId: z.string(),
      points: z.number().int().min(1),
      reference: z.string().default("manual"),
    }),
  ],
]);

describe("Event", () => {
  it("builds a frozen instance of the calling class through its schema", () => {
    const event = PointsRedeemed.create({ memberId: "usr_1", points: 5, reference: "ord_1" });
    expect(event).toBeInstanceOf(PointsRedeemed);
    expect(event).toBeInstanceOf(Event);
    expect({ ...event }).toEqual({ memberId: "usr_1", points: 5, reference: "ord_1" });
    expect(Object.isFrozen(event)).toBe(true);
  });

  it("applies the schema's defaults", () => {
    const event = PointsRedeemed.create({ memberId: "usr_1", points: 5 } as Fields<PointsRedeemed>);
    expect(event.reference).toBe("manual");
  });

  it("checks the schema's rules", () => {
    expect(() => PointsRedeemed.create({ memberId: "usr_1", points: 0, reference: "x" })).toThrow();
  });

  it("throws for a class with no registered schema", () => {
    expect(() => Unregistered.create({ memberId: "usr_1" })).toThrow(TypeError);
  });

  it("types create by the payload fields only", () => {
    expectTypeOf(
      PointsRedeemed.create({ memberId: "a", points: 1, reference: "r" }),
    ).toEqualTypeOf<PointsRedeemed>();
    // @ts-expect-error -- `points` is missing
    expect(() => PointsRedeemed.create({ memberId: "a", reference: "r" })).toThrow();
  });
});
