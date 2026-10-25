/**
 * Stackra file contract:
 * Purpose: unit tests of `widgetsFor`: the registered widgets of the given slots, layers resolved, a slot removal honoured,
 *          displays a place does not take skipped, by order then key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 18 and 19); ADR 0306 (rules 7 and 8).
 */
import type { QueryRef } from "@stackra/clients";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { WidgetDisplay } from "#core/constants/widget-display.constant";
import { Place } from "#core/enums/place.enum";
import { PlacementLayer } from "#core/enums/placement-layer.enum";
import { registerWidgets } from "#core/functions/register-widgets.function";
import { widget } from "#core/functions/widget.function";
import { widgetsFor } from "#core/functions/widgets-for.function";

/** A consumed query ref stand-in. */
const OrderKpisQuery = Object.assign(class {}, {
  kind: "query",
  key: "orders.order.kpis@1",
  permission: "orders.order.read",
  input: {},
  output: {},
  invalidateOn: [class OrderPaid {}],
}) as unknown as QueryRef;

const HEADER = { key: "dashboard.header", place: Place.Band };
const MAIN = { key: "dashboard.main", place: Place.Grid };
const kpi = WidgetDisplay.kpi("revenue");
const list = WidgetDisplay.list({ primary: "id" });

afterEach(() => {
  registerWidgets([]);
});

describe("widgetsFor", () => {
  it("returns the slot's widgets in order, layers resolved", () => {
    registerWidgets([
      widget(class {}, {
        key: "orders.kpis",
        query: OrderKpisQuery,
        display: kpi,
        slot: HEADER,
        order: 10,
      }),
      widget(class {}, {
        key: "orders.list",
        query: OrderKpisQuery,
        display: list,
        slot: HEADER,
        order: 1,
      }),
      widget(class {}, {
        key: "inventory.low",
        query: OrderKpisQuery,
        display: list,
        slot: MAIN,
        order: 20,
      }),
      widget(class {}, {
        key: "loyalty.balance",
        query: OrderKpisQuery,
        display: list,
        slot: null,
      }),
      widget(class {}, {
        key: "loyalty.balance",
        query: OrderKpisQuery,
        display: list,
        slot: MAIN,
        order: 5,
        layer: PlacementLayer.App,
      }),
      widget(class {}, { key: "orders.removed", query: OrderKpisQuery, display: list, slot: MAIN }),
      widget(class {}, {
        key: "orders.removed",
        query: OrderKpisQuery,
        display: list,
        slot: null,
        layer: PlacementLayer.Host,
      }),
    ]);
    expect(widgetsFor([HEADER]).map((entry) => entry.key)).toEqual(["orders.kpis"]);
    expect(widgetsFor([MAIN]).map((entry) => entry.key)).toEqual([
      "loyalty.balance",
      "inventory.low",
    ]);
  });
});
