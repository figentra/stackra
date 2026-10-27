/**
 * Stackra file contract:
 * Purpose: unit tests of `liveQueryRoutes`: one route per distinct invalidating event, its module read from the wire
 *          name, under the query's permission and audience; a session that holds the query's permission (not the
 *          event's) hears the data-free refresh end to end; a bad wire name or an empty permission throws.
 * Boundary: test only; the event refs are plain objects with a static-like `eventName`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0315 (decision 1); ADR 0338 (decision 3).
 */
import { buildConfig } from "@stackra/config";
import { Realm } from "@stackra/contracts";
import { BroadcastAudience } from "@stackra/events";
import type { RecordedEvent } from "@stackra/events/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RealtimeConfig } from "#config/realtime.config";
import type { RealtimeMessage } from "#contracts/types/realtime-message.type";
import { MemoryRealtimeDriver } from "#core/drivers/memory-realtime.driver";
import { liveQueryRoutes } from "#core/functions/live-query-routes.function";
import { RealtimeBroadcaster } from "#core/services/realtime-broadcaster.service";
import { RealtimeHub } from "#core/services/realtime-hub.service";
import type { RealtimeEventRef } from "#core/types/realtime-event-ref.type";

/** An event class ref of `eventName`. */
const eventRef = (eventName: string): RealtimeEventRef => ({ eventName, prototype: {} });

const SALE_COMPLETED = eventRef("sales.sale.completed.v1");
const SALE_RETURNED = eventRef("sales.sale_return.created.v2");

describe("liveQueryRoutes", () => {
  it("routes each invalidating event once under the query's permission and audience", () => {
    expect(
      liveQueryRoutes({
        permission: "sales.sale.read",
        audience: BroadcastAudience.Scope,
        invalidateOn: [SALE_COMPLETED, SALE_RETURNED, SALE_COMPLETED],
      }),
    ).toEqual([
      {
        name: "sales.sale.completed.v1",
        module: "sales",
        permission: "sales.sale.read",
        audience: BroadcastAudience.Scope,
      },
      {
        name: "sales.sale_return.created.v2",
        module: "sales",
        permission: "sales.sale.read",
        audience: BroadcastAudience.Scope,
      },
    ]);
    expect(
      liveQueryRoutes({
        permission: "sales.sale.read",
        audience: BroadcastAudience.Principal,
        invalidateOn: [],
      }),
    ).toEqual([]);
  });

  it("refreshes a session that may read the query, not the event, without the payload", async () => {
    const hub = new RealtimeHub(
      buildConfig(RealtimeConfig, { values: { channelRealms: [Realm.Staff] } }),
    );
    const driver = new MemoryRealtimeDriver(hub);
    const till: RealtimeMessage[] = [];
    const other: RealtimeMessage[] = [];
    const session = { principalId: "usr_1", scopeId: "ten_1", realm: Realm.Staff };
    driver.connect(hub.issueToken({ ...session, permissions: ["sales.sale.read"] }).token, (m) =>
      till.push(m),
    );
    driver.connect(hub.issueToken({ ...session, permissions: ["orders.order.read"] }).token, (m) =>
      other.push(m),
    );
    const [route] = liveQueryRoutes({
      permission: "sales.sale.read",
      audience: BroadcastAudience.Scope,
      invalidateOn: [SALE_COMPLETED],
    });
    if (route === undefined) throw new Error("expected a route");
    const sale: RecordedEvent = {
      event: { saleId: "sal_1", totalMinor: 1_200 },
      meta: { id: "evt_1", occurredAt: new Date(0), scopeId: "ten_1" },
    };
    await expect(new RealtimeBroadcaster(driver).broadcast(sale, route)).resolves.toBe(1);
    expect(till).toEqual([
      { channel: "tenant.ten_1.sales", name: "sales.sale.completed.v1", id: "evt_1" },
    ]);
    expect(other).toEqual([]);
  });

  it("throws on a name that is not a wire name or an empty permission", () => {
    const scope = BroadcastAudience.Scope;
    expect(() =>
      liveQueryRoutes({ permission: "", audience: scope, invalidateOn: [SALE_COMPLETED] }),
    ).toThrow(TypeError);
    for (const name of ["SaleCompleted", "sales.v1", "sales.sale.completed", "Sales.sale.done.v1"])
      expect(() =>
        liveQueryRoutes({
          permission: "sales.sale.read",
          audience: scope,
          invalidateOn: [eventRef(name)],
        }),
      ).toThrow(/not an event wire name/);
  });
});
