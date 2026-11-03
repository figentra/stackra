/**
 * Stackra file contract:
 * Purpose: unit tests of the native `useMenu` and `useMenus`: a menu is built through the container (its injected
 *          config), route entries get their unprefixed app paths, a flagged entry follows the container's
 *          `FlagReader` (its default without one), and the registered menus are listed, all or of one kind.
 * Boundary: test only; jsdom with `renderHook`, no React Native (the hooks import none); the flag reader is a local
 *           stand-in given as an override.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0294 (decisions 14, 15 and 16); ADR 0111 (decisions 1 and 3); ADR 0214.
 */
// @vitest-environment jsdom
import { Container, type Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { FlagReader, type FlagRef } from "@stackra/feature-flags";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { Menu } from "#core/bases/menu.base";
import { Route } from "#core/bases/route.base";
import { MENU_REGISTRY } from "#core/constants/menu-registry.constant";
import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import { MenuKind } from "#core/enums/menu-kind.enum";
import { registerMenus } from "#core/functions/register-menus.function";
import { registerRoutes } from "#core/functions/register-routes.function";
import { routeRef } from "#core/functions/route-ref.function";
import type { MenuBuilder } from "#core/types/menu-builder.type";
import { useMenu } from "#native/menu/use-menu";
import { useMenus } from "#native/menu/use-menus";

class OrdersRoute extends Route({ path: "/orders" }) {}
class OrderRoute extends Route({ path: "/orders/:orderId" }) {}

const Routes = { orders: routeRef("orders"), order: routeRef("order") };
const returns: FlagRef = {
  key: "mobile.returns",
  default: false,
  scopes: [],
  expires: null,
  removalIssue: null,
  label: "mobile::flags.returns.label",
};

/** A stand-in for the app config. */
class AppConfig {
  readonly helpUrl = "https://help.acme.test";
}

class MainMenu extends Menu({ kind: MenuKind.Navigation }) {
  private readonly app: AppConfig;

  constructor(app: AppConfig) {
    super();
    this.app = app;
  }

  items(m: MenuBuilder) {
    return [
      m.route(Routes.orders, { label: "mobile::nav.orders" }),
      m.route(Routes.order, { label: "mobile::nav.last", params: { orderId: "ord_1" } }),
      m.route(Routes.orders, { label: "mobile::nav.returns", flag: returns }),
      m.link("mobile::nav.help", this.app.helpUrl, { external: true }),
    ];
  }
}

class RowMenu extends Menu({ kind: MenuKind.Context }) {}

/** A menu with no constructor arguments, as the registry takes them. */
class ShopMenu extends Menu({ kind: MenuKind.Navigation }) {}

/** A wrapper whose container binds the menu and, optionally, a flag reader. */
async function wrapper(flags?: Readonly<Record<string, boolean>>) {
  const overrides = new Map<Token, object>([[MainMenu, new MainMenu(new AppConfig())]]);
  if (flags !== undefined)
    overrides.set(FlagReader, {
      get: (ref: FlagRef) => flags[ref.key] ?? ref.default,
      subscribe: () => () => undefined,
    });
  const container = await Container.create([], { overrides });
  return ({ children }: { children: ReactNode }) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
}

afterEach(() => {
  ROUTE_TABLE.clear();
  MENU_REGISTRY.clear();
});

describe("useMenu (native)", () => {
  it("resolves the menu to app paths, a flagged entry hidden by its default", async () => {
    registerRoutes({ orders: OrdersRoute, order: OrderRoute });
    const { result } = renderHook(() => useMenu(MainMenu), { wrapper: await wrapper() });
    expect(result.current).toEqual([
      { kind: "route", label: "mobile::nav.orders", to: "/orders", end: false },
      { kind: "route", label: "mobile::nav.last", to: "/orders/ord_1", end: false },
      { kind: "link", label: "mobile::nav.help", href: "https://help.acme.test", external: true },
    ]);
  });

  it("shows a flagged entry the flag reader turns on", async () => {
    registerRoutes({ orders: OrdersRoute, order: OrderRoute });
    const { result } = renderHook(() => useMenu(MainMenu), {
      wrapper: await wrapper({ "mobile.returns": true }),
    });
    expect(result.current.map((item) => item.label)).toContain("mobile::nav.returns");
  });
});

describe("useMenus (native)", () => {
  it("lists the registered menus, all or of one kind", () => {
    registerMenus({ shop_main: ShopMenu, shop_row: RowMenu });
    expect(renderHook(() => useMenus()).result.current).toEqual([
      { key: "shop_main", menu: ShopMenu },
      { key: "shop_row", menu: RowMenu },
    ]);
    expect(renderHook(() => useMenus(MenuKind.Navigation)).result.current).toEqual([
      { key: "shop_main", menu: ShopMenu },
    ]);
  });
});
