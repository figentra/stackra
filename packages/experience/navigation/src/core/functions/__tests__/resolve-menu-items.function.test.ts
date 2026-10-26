/**
 * Stackra file contract:
 * Purpose: unit tests of `createMenuBuilder` and `resolveMenuItems` over the template's menus: route entries get their
 *          href and, without a label, the route's title; params and inputs are built from the value; flagged entries
 *          and emptied groups go; links, actions, shortcuts and the placeholders keep their shape.
 * Boundary: test only; the href resolver and the flag check are local functions, the action ref a stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 14 and 16).
 */
import { afterEach, describe, expect, it } from "vitest";

import { Route } from "#core/bases/route.base";
import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import { createMenuBuilder } from "#core/functions/create-menu-builder.function";
import { registerRoutes } from "#core/functions/register-routes.function";
import { resolveHref } from "#core/functions/resolve-href.function";
import { resolveMenuItems } from "#core/functions/resolve-menu-items.function";
import { routeRef } from "#core/functions/route-ref.function";

class QuickOrderRoute extends Route({
  path: "/quick-order",
  title: "orders::quick_order.title",
}) {}
class OrderDetailRoute extends Route({ path: "/orders/:orderId" }) {}
class PageRoute extends Route({ path: "*" }) {}

const Routes = {
  quick_order: routeRef("quick_order"),
  order_detail: routeRef("order_detail"),
  page: routeRef("page"),
};
const helpCentre = {
  key: "web.help_centre",
  default: false,
  scopes: [],
  expires: null,
  removalIssue: null,
  label: "web::flags.help_centre.label",
} as const;
const CancelOrderAction = { kind: "action", key: "orders.order.cancel@1" } as never;
class ToggleSidebarShortcut {}

afterEach(() => {
  ROUTE_TABLE.clear();
});

describe("resolveMenuItems", () => {
  it("resolves routes, links and groups, and drops what a flag hides", () => {
    registerRoutes({ quick_order: QuickOrderRoute, page: PageRoute });
    const m = createMenuBuilder();
    const items = [
      m.route(Routes.quick_order, { shortcut: "mod+shift+o" }),
      m.group("web::nav.resources", [
        m.route(Routes.page, { label: "web::nav.help", params: { "*": "help" }, flag: helpCentre }),
        m.link("web::nav.docs", "https://docs.acme.test", { external: true }),
      ]),
      m.group("web::nav.hidden", [m.route(Routes.page, { label: "x", flag: helpCentre })]),
    ];
    expect(
      resolveMenuItems(items, { href: (to, params) => resolveHref(to, params), isOn: () => false }),
    ).toEqual([
      {
        kind: "route",
        label: "orders::quick_order.title",
        to: "/quick-order",
        end: false,
        shortcut: "mod+shift+o",
      },
      {
        kind: "group",
        label: "web::nav.resources",
        items: [
          { kind: "link", label: "web::nav.docs", href: "https://docs.acme.test", external: true },
        ],
      },
    ]);
  });

  it("builds params and inputs from the context menu's value", () => {
    registerRoutes({ order_detail: OrderDetailRoute });
    const m = createMenuBuilder<{ id: string }>();
    const items = [
      m.route(Routes.order_detail, {
        label: "mobile::order_card.open",
        icon: "eye",
        params: (order) => ({ orderId: order.id }),
      }),
      m.action(CancelOrderAction, {
        label: "mobile::order_card.cancel",
        destructive: true,
        input: (order) => ({ orderId: order.id }),
      }),
    ];
    expect(
      resolveMenuItems(items, {
        value: { id: "ord_1" },
        href: (to, params) => resolveHref(to, params),
        isOn: () => true,
      }),
    ).toEqual([
      {
        kind: "route",
        label: "mobile::order_card.open",
        to: "/orders/ord_1",
        end: false,
        icon: "eye",
      },
      {
        kind: "action",
        label: "mobile::order_card.cancel",
        action: CancelOrderAction,
        input: { orderId: "ord_1" },
        destructive: true,
      },
    ]);
  });

  it("keeps shortcuts and the placeholders", () => {
    const m = createMenuBuilder();
    const items = [m.shortcut(ToggleSidebarShortcut), m.separator(), m.navigation(), m.tabs()];
    expect(resolveMenuItems(items, { href: () => "/", isOn: () => true })).toEqual([
      { kind: "shortcut", label: "", shortcut: ToggleSidebarShortcut },
      { kind: "separator", label: "" },
      { kind: "navigation", label: "" },
      { kind: "tabs", label: "" },
    ]);
  });
});
