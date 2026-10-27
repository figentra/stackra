/**
 * Stackra file contract:
 * Purpose: unit tests of `downgrade`: a dated version runs the `down` of the change with the earliest `from` after it;
 *          the newest version and a subject with no change return the value itself; a whole version runs the change
 *          from it; each change converts straight from the current shape; the value is never mutated; a malformed date,
 *          a version of the wrong form, a version outside the event's range and a version with no change are refused.
 * Boundary: test only; registers zod schemas and changes the way gen does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0118 (decision 2 and the 2026-10-23 note); ADR 0141.
 */
import { IntegrationEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { Change } from "#core/bases/change.base";
import { downgrade } from "#core/functions/downgrade.function";
import { registerChanges } from "#core/functions/register-changes.function";

class OrderView extends Schema {
  id!: string;

  totals!: { totalMinor: number; currency: string };

  note!: string;
}

/** Before 2027-09-01 there was no note. */
class OrderView202709Change extends Change<OrderView>({
  from: "2027-09-01",
  sunset: "2028-09-01",
}) {
  id!: string;

  totals!: { totalMinor: number; currency: string };

  down(view: OrderView): OrderView202709Change {
    return OrderView202709Change.create({ id: view.id, totals: view.totals });
  }
}

/** Before 2027-03-01 the totals were flat, and there was no note either. */
class OrderView202703Change extends Change<OrderView>({
  from: "2027-03-01",
  sunset: "2028-03-01",
}) {
  id!: string;

  totalMinor!: number;

  currency!: string;

  down(view: OrderView): OrderView202703Change {
    return OrderView202703Change.create({
      id: view.id,
      totalMinor: view.totals.totalMinor,
      currency: view.totals.currency,
    });
  }
}

class PointsEarned extends IntegrationEvent({
  name: "points.earned",
  version: 3,
}) {
  memberId!: string;

  points!: number;

  tier!: string;

  balanceAfter!: number;
}

/** v2 had no balance. */
class PointsEarnedV2Change extends Change<PointsEarned>({
  from: 2,
  sunset: "2027-10-01",
}) {
  memberId!: string;

  points!: number;

  tier!: string;

  up(v2: PointsEarnedV2Change): PointsEarned {
    return PointsEarned.create({ ...v2, balanceAfter: v2.points });
  }

  down(v3: PointsEarned): PointsEarnedV2Change {
    return PointsEarnedV2Change.create({ memberId: v3.memberId, points: v3.points, tier: v3.tier });
  }
}

/** v1 had no tier either. */
class PointsEarnedV1Change extends Change<PointsEarned>({
  from: 1,
  sunset: "2027-04-01",
}) {
  memberId!: string;

  points!: number;

  up(v1: PointsEarnedV1Change): PointsEarned {
    return PointsEarned.create({ ...v1, tier: "bronze", balanceAfter: v1.points });
  }

  down(v3: PointsEarned): PointsEarnedV1Change {
    return PointsEarnedV1Change.create({ memberId: v3.memberId, points: v3.points });
  }
}

class StockMoved extends IntegrationEvent({
  name: "stock.moved",
  version: 3,
}) {
  sku!: string;
}

class StockMovedV1Change extends Change<StockMoved>({
  from: 1,
  sunset: "2027-04-01",
}) {
  up(): StockMoved {
    return StockMoved.create({ sku: "sku_1" });
  }

  down(): StockMovedV1Change {
    return StockMovedV1Change.create({});
  }
}

class CustomerView extends Schema {
  id!: string;
}

const totals = z.object({ totalMinor: z.number().int(), currency: z.string() });
registerSchemas([
  [OrderView202709Change, z.object({ id: z.string(), totals })],
  [
    OrderView202703Change,
    z.object({ id: z.string(), totalMinor: z.number().int(), currency: z.string() }),
  ],
  [
    PointsEarned,
    z.object({
      memberId: z.string(),
      points: z.number().int(),
      tier: z.string(),
      balanceAfter: z.number().int(),
    }),
  ],
  [
    PointsEarnedV2Change,
    z.object({ memberId: z.string(), points: z.number().int(), tier: z.string() }),
  ],
  [PointsEarnedV1Change, z.object({ memberId: z.string(), points: z.number().int() })],
  [StockMoved, z.object({ sku: z.string() })],
  [StockMovedV1Change, z.object({})],
]);
registerChanges([
  [OrderView, OrderView202703Change],
  [OrderView, OrderView202709Change],
  [PointsEarned, PointsEarnedV1Change],
  [PointsEarned, PointsEarnedV2Change],
  [StockMoved, StockMovedV1Change],
]);

const view = Object.freeze({
  id: "ord_1",
  totals: { totalMinor: 900, currency: "SAR" },
  note: "leave at the door",
}) as OrderView;

const earned = PointsEarned.create({
  memberId: "usr_1",
  points: 5,
  tier: "gold",
  balanceAfter: 40,
});

describe("downgrade", () => {
  it("returns the value itself when no change serves the version", () => {
    expect(downgrade(OrderView, view, "2027-09-01")).toBe(view);
    expect(downgrade(OrderView, view, "2028-01-01")).toBe(view);
    const customer = { id: "cus_1" } as CustomerView;
    expect(downgrade(CustomerView, customer, "2026-10-01")).toBe(customer);
    expect(downgrade(PointsEarned, earned, 3)).toBe(earned);
  });

  it("runs the dated change with the earliest from after the version", () => {
    expect(downgrade(OrderView, view, "2027-06-01")).toEqual({
      id: "ord_1",
      totals: { totalMinor: 900, currency: "SAR" },
    });
    expect(downgrade(OrderView, view, "2027-03-01")).toBeInstanceOf(OrderView202709Change);
    expect(downgrade(OrderView, view, "2026-10-01")).toEqual({
      id: "ord_1",
      totalMinor: 900,
      currency: "SAR",
    });
  });

  it("runs the change from the event version, straight from the current one", () => {
    expect(downgrade(PointsEarned, earned, 2)).toEqual({
      memberId: "usr_1",
      points: 5,
      tier: "gold",
    });
    expect(downgrade(PointsEarned, earned, 1)).toEqual({ memberId: "usr_1", points: 5 });
    expect(earned).toEqual({ memberId: "usr_1", points: 5, tier: "gold", balanceAfter: 40 });
  });

  it("refuses a malformed date or a version of the wrong form", () => {
    expect(() => downgrade(OrderView, view, "2027-13-01")).toThrow(TypeError);
    expect(() => downgrade(OrderView, view, 1)).toThrow(TypeError);
    expect(() => downgrade(PointsEarned, earned, "2026-10-01")).toThrow(TypeError);
  });

  it("refuses an event version outside the subject's range or without a change", () => {
    expect(() => downgrade(PointsEarned, earned, 0)).toThrow(RangeError);
    expect(() => downgrade(PointsEarned, earned, 4)).toThrow(RangeError);
    expect(() => downgrade(PointsEarned, earned, 1.5)).toThrow(RangeError);
    const moved = StockMoved.create({ sku: "sku_1" });
    expect(downgrade(StockMoved, moved, 1)).toEqual({});
    expect(() => downgrade(StockMoved, moved, 2)).toThrow(RangeError);
  });
});
