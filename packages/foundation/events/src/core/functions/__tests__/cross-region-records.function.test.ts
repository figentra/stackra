/**
 * Stackra file contract:
 * Purpose: unit tests of `crossRegionRecords`: it keeps only `crossRegion` integration events, in order, and refuses
 *          one that carries a tenant (ADR 0353 decision 5).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0353 (decision 5); STA-1268.
 */
import { describe, expect, it } from "@stackra/testing";

import { DomainEvent } from "#core/bases/domain-event.base";
import { IntegrationEvent } from "#core/bases/integration-event.base";
import { crossRegionRecords } from "#core/functions/cross-region-records.function";

class CatalogueVersionApproved extends IntegrationEvent({
  name: "catalogue_version.approved",
  crossRegion: true,
}) {}
class OrderPaid extends IntegrationEvent({ name: "order.paid" }) {}
class OrderNoted extends IntegrationEvent({
  name: "order.noted",
  crossRegion: false,
}) {}
class PointsRedeemed extends DomainEvent {}

const at = new Date(0);
const record = (event: object, id: string, scopeId?: string) => ({
  event,
  meta: { id, occurredAt: at, ...(scopeId === undefined ? {} : { scopeId }) },
});

describe("crossRegionRecords", () => {
  it("keeps only crossRegion integration events, in order", () => {
    const first = record(new CatalogueVersionApproved(), "evt_1");
    const second = record(new CatalogueVersionApproved(), "evt_4");
    const batch = [
      first,
      record(new OrderPaid(), "evt_2", "tnt_1"),
      record(new OrderNoted(), "evt_3"),
      second,
      record(new PointsRedeemed(), "evt_5"),
      record({}, "evt_6"),
    ];
    expect(crossRegionRecords(batch)).toEqual([first, second]);
    expect(crossRegionRecords([])).toEqual([]);
  });

  it("refuses a crossRegion event that carries a tenant", () => {
    expect(() =>
      crossRegionRecords([record(new CatalogueVersionApproved(), "evt_1", "tnt_1")]),
    ).toThrow(/evt_1 carries tenant data/);
  });
});
