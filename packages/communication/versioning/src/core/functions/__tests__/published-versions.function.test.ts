/**
 * Stackra file contract:
 * Purpose: unit tests of `publishedVersions`: an event's older versions are published until each change's sunset day
 *          (exclusive, in UTC), oldest first; a subject with no change or with dated changes has none.
 * Boundary: test only; registers changes the way gen does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0141 (2026-10-23 note); ADR 0118 (2026-10-23 note).
 */
import { IntegrationEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import { Change } from "#core/bases/change.base";
import { publishedVersions } from "#core/functions/published-versions.function";
import { registerChanges } from "#core/functions/register-changes.function";

class StockMoved extends IntegrationEvent({
  name: "stock.moved",
  version: 3,
}) {
  sku!: string;
}

class StockMovedV1Change extends Change<StockMoved>({
  from: 1,
  sunset: "2027-01-01",
}) {
  up(): StockMoved {
    return StockMoved.create({ sku: "" });
  }

  down(): StockMovedV1Change {
    return StockMovedV1Change.create({});
  }
}

class StockMovedV2Change extends Change<StockMoved>({
  from: 2,
  sunset: "2027-06-01",
}) {
  up(): StockMoved {
    return StockMoved.create({ sku: "" });
  }

  down(): StockMovedV2Change {
    return StockMovedV2Change.create({});
  }
}

class StockView extends Schema {
  sku!: string;
}

class StockView202701Change extends Change<StockView>({
  from: "2027-01-01",
  sunset: "2028-01-01",
}) {
  down(): StockView202701Change {
    return StockView202701Change.create({});
  }
}

class Untouched extends IntegrationEvent({
  name: "untouched.event",
}) {}

registerChanges([
  [StockMoved, StockMovedV2Change],
  [StockMoved, StockMovedV1Change],
  [StockView, StockView202701Change],
]);

describe(publishedVersions, () => {
  it("lists each older version before its sunset day, oldest first", () => {
    expect(publishedVersions(StockMoved, new Date("2026-12-31T23:59:59Z"))).toEqual([1, 2]);
    expect(publishedVersions(StockMoved, new Date("2027-01-01T00:00:00Z"))).toEqual([2]);
    expect(publishedVersions(StockMoved, new Date("2027-06-01T00:00:00Z"))).toEqual([]);
  });

  it("has none for an event with no change or a dated subject", () => {
    expect(publishedVersions(Untouched, new Date("2026-10-29T00:00:00Z"))).toEqual([]);
    expect(publishedVersions(StockView, new Date("2026-10-29T00:00:00Z"))).toEqual([]);
  });
});
