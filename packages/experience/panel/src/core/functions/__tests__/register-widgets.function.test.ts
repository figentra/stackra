/**
 * Stackra file contract:
 * Purpose: unit tests of `registerWidgets`: the table is recorded frozen and a later call replaces it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 19).
 */
import type { QueryRef } from "@stackra/clients";
import { describe, expect, it } from "@stackra/testing";

import { WIDGET_REGISTRY } from "#core/constants/widget-registry.constant";
import { WidgetDisplay } from "#core/constants/widget-display.constant";
import { registerWidgets } from "#core/functions/register-widgets.function";
import { widget } from "#core/functions/widget.function";

/** A consumed query ref stand-in. */
const OrderKpisQuery = Object.assign(class {}, {
  kind: "query",
  key: "orders.order.kpis@1",
  permission: "orders.order.read",
  input: {},
  output: {},
  invalidateOn: [class OrderPaid {}],
}) as unknown as QueryRef;

describe("registerWidgets", () => {
  it("records the table and replaces it on the next call", () => {
    const first = widget(class {}, {
      key: "orders.a",
      query: OrderKpisQuery,
      display: WidgetDisplay.custom(),
    });
    const second = widget(class {}, {
      key: "orders.b",
      query: OrderKpisQuery,
      display: WidgetDisplay.custom(),
    });
    const table = registerWidgets([first]);
    expect(Object.isFrozen(table)).toBe(true);
    expect(WIDGET_REGISTRY).toEqual([first]);
    registerWidgets([second]);
    expect(WIDGET_REGISTRY).toEqual([second]);
    registerWidgets([]);
  });
});
