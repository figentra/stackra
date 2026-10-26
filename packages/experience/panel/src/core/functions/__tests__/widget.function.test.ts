/**
 * Stackra file contract:
 * Purpose: unit tests of `widget`: a descriptor read from a generated widget ref's statics and the given placement, with
 *          defaults (Medium, order 0, the owner layer, the derived title, the query's events), and the refusals of a
 *          missing key or display and a refresh under 30 seconds.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 14 and 17 to 19); ADR 0336 (decision 4).
 */
import type { QueryRef } from "@stackra/clients";
import { SystemRole } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";

import { WidgetDisplay } from "#core/constants/widget-display.constant";
import { Place } from "#core/enums/place.enum";
import { PlacementLayer } from "#core/enums/placement-layer.enum";
import { TimeRange } from "#core/enums/time-range.enum";
import { WidgetSize } from "#core/enums/widget-size.enum";
import { widget } from "#core/functions/widget.function";

/** Stands in for the permission constants gen emits in an app. */
const TestPermissions = {
  ordersOrderRead: "orders.order.read",
} as const;

/** A consumed query ref stand-in. */
const OrderKpisQuery = Object.assign(class {}, {
  kind: "query",
  key: "orders.order.kpis@1",
  permission: TestPermissions.ordersOrderRead,
  input: {},
  output: {},
  invalidateOn: [class OrderPaid {}],
}) as unknown as QueryRef;

/** A generated widget ref stand-in. */
const OrderKpisWidget = Object.assign(class {}, {
  key: "orders.order_kpis",
  query: OrderKpisQuery,
  options: Object.freeze({
    display: WidgetDisplay.kpiGroup([WidgetDisplay.kpi("revenue")]),
    size: WidgetSize.Full,
    ranges: [TimeRange.Today, TimeRange.Last7Days],
    range: TimeRange.Today,
  }),
});

describe("widget", () => {
  it("reads the ref's statics and fills the defaults", () => {
    const descriptor = widget(OrderKpisWidget, {
      slot: { key: "dashboard.header", place: Place.Band },
      order: 10,
      permission: TestPermissions.ordersOrderRead,
      roles: [SystemRole.Owner],
    });
    expect(descriptor).toMatchObject({
      key: "orders.order_kpis",
      widget: OrderKpisWidget,
      query: OrderKpisQuery,
      display: { kind: "kpi_group" },
      slot: { key: "dashboard.header" },
      size: "full",
      order: 10,
      params: {},
      ranges: ["today", "last_7_days"],
      range: "today",
      refreshOn: OrderKpisQuery.invalidateOn,
      permission: TestPermissions.ordersOrderRead,
      roles: ["owner"],
      layer: PlacementLayer.Owner,
      title: "orders::widgets.order_kpis.title",
    });
    expect(Object.isFrozen(descriptor)).toBe(true);
  });

  it("takes the placement's own values", () => {
    const descriptor = widget(OrderKpisWidget, {
      size: WidgetSize.Medium,
      refreshEvery: "60s",
      params: { accountId: "actor.accountId" },
      placedBy: "src/overrides/x.widget.ts",
      layer: PlacementLayer.App,
    });
    expect(descriptor).toMatchObject({
      slot: null,
      size: "medium",
      refreshEveryMs: 60_000,
      params: { accountId: "actor.accountId" },
      layer: "3",
    });
  });

  it("refuses a missing key, query or display and a refresh under 30 seconds", () => {
    expect(() => widget(class {})).toThrow(/key/);
    expect(() => widget(class {}, { key: "orders.x" })).toThrow(/query/);
    expect(() => widget(class {}, { key: "orders.x", query: OrderKpisQuery })).toThrow(/display/);
    expect(() => widget(OrderKpisWidget, { refreshEvery: "5s" })).toThrow(RangeError);
  });
});
