/**
 * Stackra file contract:
 * Purpose: unit tests of `upgrade`: an old payload is checked by its version's schema and lifted by that change's `up`
 *          to a frozen event of the current version; a current payload is built by the event itself; a bad payload, a
 *          subject with dated changes, a version outside the range and a version without a change are refused.
 * Boundary: test only; registers zod schemas and changes the way gen does. The change mirrors the template's
 *           `points-earned-v1.change.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0141 (2026-10-23 note); ADR 0118 (2026-10-23 note).
 */
import { type EventClass, IntegrationEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { Change } from "#core/bases/change.base";
import { registerChanges } from "#core/functions/register-changes.function";
import { upgrade } from "#core/functions/upgrade.function";

class PointsEarned extends IntegrationEvent({ name: "points.earned", version: 3 }) {
  memberId!: string;

  points!: number;

  tier!: string;

  balanceAfter!: number;
}

/** v1 had no tier and no balance. */
class PointsEarnedV1Change extends Change<PointsEarned>({ from: 1, sunset: "2027-04-01" }) {
  memberId!: string;

  points!: number;

  up(v1: PointsEarnedV1Change): PointsEarned {
    return PointsEarned.create({ ...v1, tier: "bronze", balanceAfter: v1.points });
  }

  down(v3: PointsEarned): PointsEarnedV1Change {
    return PointsEarnedV1Change.create({ memberId: v3.memberId, points: v3.points });
  }
}

class OrderView extends Schema {
  id!: string;
}

class OrderView202703Change extends Change<OrderView>({
  from: "2027-03-01",
  sunset: "2028-03-01",
}) {
  down(): OrderView202703Change {
    return OrderView202703Change.create({});
  }
}

registerSchemas([
  [
    PointsEarned,
    z.object({
      memberId: z.string(),
      points: z.number().int(),
      tier: z.string(),
      balanceAfter: z.number().int(),
    }),
  ],
  [PointsEarnedV1Change, z.object({ memberId: z.string(), points: z.number().int() })],
]);
registerChanges([
  [PointsEarned, PointsEarnedV1Change],
  [OrderView, OrderView202703Change],
]);

describe("upgrade", () => {
  it("lifts an old payload to a frozen event of the current version", () => {
    const earned = upgrade(PointsEarned, { memberId: "usr_1", points: 5 }, 1);
    expect(earned).toBeInstanceOf(PointsEarned);
    expect(earned).toEqual({ memberId: "usr_1", points: 5, tier: "bronze", balanceAfter: 5 });
    expect(Object.isFrozen(earned)).toBe(true);
  });

  it("builds a current payload with the event itself", () => {
    const payload = { memberId: "usr_1", points: 5, tier: "gold", balanceAfter: 40 };
    const earned = upgrade(PointsEarned, payload, 3);
    expect(earned).toBeInstanceOf(PointsEarned);
    expect(earned).toEqual(payload);
  });

  it("checks the payload against the schema of its version", () => {
    expect(() => upgrade(PointsEarned, { memberId: "usr_1", points: "five" }, 1)).toThrow();
    expect(() => upgrade(PointsEarned, { memberId: "usr_1", points: 5 }, 3)).toThrow();
  });

  it("refuses a subject with dated changes, a version outside the range or without a change", () => {
    expect(() => upgrade(OrderView as unknown as EventClass, {}, 1)).toThrow(TypeError);
    expect(() => upgrade(PointsEarned, {}, 0)).toThrow(RangeError);
    expect(() => upgrade(PointsEarned, {}, 4)).toThrow(RangeError);
    expect(() => upgrade(PointsEarned, {}, 2)).toThrow(RangeError);
  });
});
