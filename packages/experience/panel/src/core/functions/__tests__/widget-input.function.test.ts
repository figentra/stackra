/**
 * Stackra file contract:
 * Purpose: unit tests of `widgetInput`: fixed params pass, actor binds read the given facts or are left out, and the range is
 *          added only for a widget that takes one.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 14, 18 and 20).
 */
import type { QueryRef } from "@stackra/clients";
import { describe, expect, it } from "@stackra/testing";

import { WidgetDisplay } from "#core/constants/widget-display.constant";
import { TimeRange } from "#core/enums/time-range.enum";
import { widget } from "#core/functions/widget.function";
import { widgetInput } from "#core/functions/widget-input.function";

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

const balance = widget(class {}, {
  key: "loyalty_kit.points_balance",
  query: OrderKpisQuery,
  display: WidgetDisplay.custom(),
  params: { accountId: "actor.accountId", limit: 5 },
});
const kpis = widget(class {}, {
  key: "orders.order_kpis",
  query: OrderKpisQuery,
  display: WidgetDisplay.custom(),
  ranges: [TimeRange.Today, TimeRange.Last7Days],
  range: TimeRange.Today,
});

describe("widgetInput", () => {
  it("resolves actor binds from the given facts", () => {
    expect(widgetInput(balance, { actor: { accountId: "lac_1" } })).toEqual({
      accountId: "lac_1",
      limit: 5,
    });
    expect(widgetInput(balance)).toEqual({ limit: 5 });
  });

  it("adds the range only to a widget that takes one", () => {
    expect(widgetInput(kpis)).toEqual({ range: "today" });
    expect(widgetInput(kpis, { range: TimeRange.Last7Days })).toEqual({ range: "last_7_days" });
    expect(widgetInput(balance, { range: TimeRange.Last7Days })).toEqual({ limit: 5 });
  });
});
