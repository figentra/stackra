/**
 * Stackra file contract:
 * Purpose: unit tests of `eventChangeOf`: the change from an old version is found, the current version needs none, a
 *          subject that is not an integration event has only version 1, and a version out of range, a version without a
 *          change and a subject with dated changes are refused.
 * Boundary: test only; an internal function, reached through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0141 (2026-10-23 note).
 */
import { IntegrationEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import { Change } from "#core/bases/change.base";
import { eventChangeOf } from "#core/functions/event-change-of.function";
import { registerChanges } from "#core/functions/register-changes.function";

class StockMoved extends IntegrationEvent({
  name: "stock.moved",
  version: 3,
}) {
  sku!: string;
}

const StockMovedV2Change = Change<StockMoved>({ from: 2, sunset: "2027-10-01" });

class StockView extends Schema {
  sku!: string;
}

const StockView202703Change = Change<StockView>({ from: "2027-03-01", sunset: "2028-03-01" });

class CustomerView extends Schema {
  id!: string;
}

registerChanges([
  [StockMoved, StockMovedV2Change],
  [StockView, StockView202703Change],
]);

describe("eventChangeOf", () => {
  it("finds the change from an old version and none for the current one", () => {
    expect(eventChangeOf(StockMoved, 2)).toEqual({
      type: StockMovedV2Change,
      from: 2,
      sunset: "2027-10-01",
    });
    expect(eventChangeOf(StockMoved, 3)).toBeUndefined();
    expect(eventChangeOf(CustomerView, 1)).toBeUndefined();
  });

  it("refuses a version out of range or without a change", () => {
    expect(() => eventChangeOf(StockMoved, 0)).toThrow(RangeError);
    expect(() => eventChangeOf(StockMoved, 4)).toThrow(RangeError);
    expect(() => eventChangeOf(StockMoved, 2.5)).toThrow(RangeError);
    expect(() => eventChangeOf(StockMoved, 1)).toThrow(RangeError);
    expect(() => eventChangeOf(CustomerView, 2)).toThrow(RangeError);
  });

  it("refuses a subject with dated changes", () => {
    expect(() => eventChangeOf(StockView, 1)).toThrow(TypeError);
  });
});
