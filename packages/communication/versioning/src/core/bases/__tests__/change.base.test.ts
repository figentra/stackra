/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Change`: both called forms record the `change` kind with exactly `from` and
 *          `sunset`; a change is a shape built with `create`, an instance of `Change` and of `Schema`; `up` and `down`
 *          convert both ways; bad options are refused; a missing type argument, a `from` of the wrong form, a subject
 *          of the wrong kind and an event change without `up` fail to compile.
 * Boundary: test only; the changes mirror the template's `points-earned-v1.change.ts` and `order-view-2027-03.change.ts`
 *           and register zod schemas the way gen does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rules 2, 5 and 44); ADR 0118 and ADR 0141 (2026-10-23
 *                     notes).
 */
import { kindOf } from "@stackra/container";
import { IntegrationEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { Change } from "#core/bases/change.base";

class PointsEarned extends IntegrationEvent({ name: "points.earned", version: 2 }) {
  memberId!: string;

  points!: number;

  tier!: string;
}

class PointsEarnedV1Change extends Change<PointsEarned>({ from: 1, sunset: "2027-04-01" }) {
  memberId!: string;

  points!: number;

  up(v1: PointsEarnedV1Change): PointsEarned {
    return PointsEarned.create({ memberId: v1.memberId, points: v1.points, tier: "bronze" });
  }

  down(v2: PointsEarned): PointsEarnedV1Change {
    return PointsEarnedV1Change.create({ memberId: v2.memberId, points: v2.points });
  }
}

class OrderView extends Schema {
  id!: string;

  totals!: { totalMinor: number; currency: string };
}

class OrderView202703Change extends Change<OrderView>({
  from: "2027-03-01",
  sunset: "2028-03-01",
}) {
  id!: string;

  totalMinor!: number;

  down(view: OrderView): OrderView202703Change {
    return OrderView202703Change.create({ id: view.id, totalMinor: view.totals.totalMinor });
  }
}

registerSchemas([
  [PointsEarned, z.object({ memberId: z.string(), points: z.number().int(), tier: z.string() })],
  [PointsEarnedV1Change, z.object({ memberId: z.string(), points: z.number().int() })],
  [OrderView202703Change, z.object({ id: z.string(), totalMinor: z.number().int() })],
]);

describe("Change", () => {
  it("records the change kind with exactly from and sunset", () => {
    expect(kindOf(PointsEarnedV1Change)).toEqual({
      kind: "change",
      options: { from: 1, sunset: "2027-04-01" },
    });
    expect(kindOf(OrderView202703Change)).toEqual({
      kind: "change",
      options: { from: "2027-03-01", sunset: "2028-03-01" },
    });
    const extra = { from: 1, sunset: "2027-04-01", note: "dropped" };
    expect(kindOf(Change<PointsEarned>(extra))?.options).toEqual({ from: 1, sunset: "2027-04-01" });
  });

  it("is a shape built with create, in both forms", () => {
    const v1 = PointsEarnedV1Change.create({ memberId: "usr_1", points: 5 });
    expect(v1).toBeInstanceOf(PointsEarnedV1Change);
    expect(v1).toBeInstanceOf(Change);
    expect(v1).toBeInstanceOf(Schema);
    const old = OrderView202703Change.create({ id: "ord_1", totalMinor: 900 });
    expect(old).toBeInstanceOf(Change);
    expect(old).toEqual({ id: "ord_1", totalMinor: 900 });
    expect(() => PointsEarnedV1Change.create({ memberId: "usr_1", points: 1.5 })).toThrow();
  });

  it("converts down, and up for an event change", () => {
    const v2 = PointsEarned.create({ memberId: "usr_1", points: 5, tier: "gold" });
    const v1 = new PointsEarnedV1Change().down(v2);
    expect(v1).toEqual({ memberId: "usr_1", points: 5 });
    expect(new PointsEarnedV1Change().up(v1)).toEqual({
      memberId: "usr_1",
      points: 5,
      tier: "bronze",
    });
    const view = { id: "ord_1", totals: { totalMinor: 900, currency: "SAR" } } as OrderView;
    expect(new OrderView202703Change().down(view)).toEqual({ id: "ord_1", totalMinor: 900 });
  });

  it("refuses a bad from", () => {
    expect(() => Change<PointsEarned>({ from: 0, sunset: "2027-04-01" })).toThrow(RangeError);
    expect(() => Change<PointsEarned>({ from: 1.5, sunset: "2027-04-01" })).toThrow(RangeError);
    expect(() => Change<OrderView>({ from: "2027-02-30", sunset: "2028-03-01" })).toThrow(
      TypeError,
    );
    expect(() => Change<OrderView>({ from: "march", sunset: "2028-03-01" })).toThrow(TypeError);
    expect(() => Change(undefined as never)).toThrow(TypeError);
  });

  it("refuses a bad sunset", () => {
    expect(() => Change<PointsEarned>({ from: 1, sunset: "soon" })).toThrow(TypeError);
    expect(() => Change<OrderView>({ from: "2027-03-01", sunset: "2027-03-01" })).toThrow(
      RangeError,
    );
  });

  it("types the forms from the subject", () => {
    // @ts-expect-error -- the called form needs the subject as a type argument
    const Untyped = Change({ from: 1, sunset: "2027-04-01" });
    // @ts-expect-error -- an event change takes a whole version
    const DatedEvent = Change<PointsEarned>({ from: "2027-03-01", sunset: "2028-03-01" });
    // @ts-expect-error -- a schema takes a dated change
    const NumberedSchema = Change<OrderView>({ from: 1, sunset: "2027-04-01" });
    // @ts-expect-error -- an event change implements up
    class WithoutUp extends Change<PointsEarned>({ from: 1, sunset: "2027-04-01" }) {
      down(): WithoutUp {
        return WithoutUp.create({});
      }
    }
    expect([Untyped, DatedEvent, NumberedSchema, WithoutUp]).toHaveLength(4);
  });
});
