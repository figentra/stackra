/**
 * Stackra file contract:
 * Purpose: unit tests of `registerChanges`: pairs are recorded oldest `from` first with their options, a second
 *          registration of a class changes nothing, and a non-change class, a subject of the wrong kind, an event
 *          change at or above its subject's version and two changes sharing a `from` are refused.
 * Boundary: test only; reads the internal registry through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0118 and ADR 0141 (2026-10-23 notes); ADR 0305 (rule 5).
 */
import { DomainEvent, IntegrationEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import { Change } from "#core/bases/change.base";
import { CHANGE_REGISTRY } from "#core/constants/change-registry.constant";
import { registerChanges } from "#core/functions/register-changes.function";
import type { ChangeClass } from "#core/types/change-class.type";

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

class StockMovedV2Change extends Change<StockMoved>({
  from: 2,
  sunset: "2027-10-01",
}) {
  up(): StockMoved {
    return StockMoved.create({ sku: "sku_1" });
  }

  down(): StockMovedV2Change {
    return StockMovedV2Change.create({});
  }
}

class StockView extends Schema {
  sku!: string;
}

class StockView202703Change extends Change<StockView>({
  from: "2027-03-01",
  sunset: "2028-03-01",
}) {
  down(): StockView202703Change {
    return StockView202703Change.create({});
  }
}

class StockCounted extends DomainEvent {
  sku!: string;
}

describe("registerChanges", () => {
  it("records each subject's changes oldest from first", () => {
    registerChanges([
      [StockMoved, StockMovedV2Change],
      [StockMoved, StockMovedV1Change],
      [StockView, StockView202703Change],
    ]);
    expect(CHANGE_REGISTRY.get(StockMoved)).toEqual([
      { type: StockMovedV1Change, from: 1, sunset: "2027-04-01" },
      { type: StockMovedV2Change, from: 2, sunset: "2027-10-01" },
    ]);
    expect(CHANGE_REGISTRY.get(StockView)).toEqual([
      { type: StockView202703Change, from: "2027-03-01", sunset: "2028-03-01" },
    ]);
  });

  it("changes nothing when a class is registered again", () => {
    registerChanges([[StockMoved, StockMovedV1Change]]);
    expect(CHANGE_REGISTRY.get(StockMoved)).toHaveLength(2);
  });

  it("refuses a class that is not a change", () => {
    expect(() => registerChanges([[StockView, StockView as unknown as ChangeClass]])).toThrow(
      TypeError,
    );
  });

  it("refuses a subject of the wrong kind", () => {
    expect(() => registerChanges([[StockView, StockMovedV1Change]])).toThrow(TypeError);
    expect(() => registerChanges([[StockCounted, StockMovedV1Change]])).toThrow(TypeError);
    expect(() => registerChanges([[StockMoved, StockView202703Change]])).toThrow(TypeError);
  });

  it("refuses an event change at or above its subject's version", () => {
    const AtCurrent = Change<StockMoved>({ from: 3, sunset: "2028-01-01" });
    expect(() => registerChanges([[StockMoved, AtCurrent]])).toThrow(RangeError);
  });

  it("refuses two changes from the same version or day", () => {
    const AnotherV1 = Change<StockMoved>({ from: 1, sunset: "2027-06-01" });
    expect(() => registerChanges([[StockMoved, AnotherV1]])).toThrow(TypeError);
    const AnotherDated = Change<StockView>({ from: "2027-03-01", sunset: "2028-06-01" });
    expect(() => registerChanges([[StockView, AnotherDated]])).toThrow(TypeError);
  });
});
