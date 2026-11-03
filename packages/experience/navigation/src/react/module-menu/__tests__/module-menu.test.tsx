/**
 * Stackra file contract:
 * Purpose: proves the web ModuleMenu draws every declared navigation menu, in registry order, as one Sidebar landmark
 *          named by `label`: route entries are links with their hrefs and translated labels, a group is a heading over
 *          its links, a context menu and an entry behind a flag that is off stay out, the place under the current path
 *          is `aria-current="page"` (a home entry with `end` only on its exact path), `items` replaces the declared
 *          menus, the arrow keys move between the places, and the layout stays logical in Arabic.
 * Boundary: unit tier, jsdom, the real @stackra/ui Sidebar, a real container and registries under a memory router;
 *           the translator is a stand-in that echoes the key (no catalogue loads in vitest).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0111 (decisions 1 and 3); ADR 0317 (decisions 1, 3 and 4); ADR 0060.
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import type { FlagRef } from "@stackra/feature-flags";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Menu } from "#core/bases/menu.base";
import { Route } from "#core/bases/route.base";
import { MENU_REGISTRY } from "#core/constants/menu-registry.constant";
import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import { MenuKind } from "#core/enums/menu-kind.enum";
import { registerMenus } from "#core/functions/register-menus.function";
import { registerRoutes } from "#core/functions/register-routes.function";
import { routeRef } from "#core/functions/route-ref.function";
import type { MenuBuilder } from "#core/types/menu-builder.type";
import { ModuleMenu } from "#react/module-menu/module-menu";

vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => ({ t: (key: string) => `t:${key}` }),
}));

class HomeRoute extends Route({ path: "/" }) {}
class OrdersRoute extends Route({ path: "/orders" }) {}
class SalesRoute extends Route({ path: "/reports/sales" }) {}

const Routes = { home: routeRef("home"), orders: routeRef("orders"), sales: routeRef("sales") };

const beta: FlagRef = {
  key: "web.beta_reports",
  default: false,
  scopes: [],
  expires: null,
  removalIssue: null,
  label: "web::flags.beta_reports.label",
};

class OrdersMenu extends Menu({ kind: MenuKind.Navigation }) {
  items(m: MenuBuilder) {
    return [
      m.route(Routes.home, { label: "web::nav.home", end: true }),
      m.route(Routes.orders, { label: "web::nav.orders", icon: "check" }),
    ];
  }
}

class ReportsMenu extends Menu({ kind: MenuKind.Navigation }) {
  items(m: MenuBuilder) {
    return [
      m.group("web::nav.reports", [m.route(Routes.sales, { label: "web::nav.sales" })]),
      m.route(Routes.orders, { label: "web::nav.beta", flag: beta }),
    ];
  }
}

class RowMenu extends Menu({ kind: MenuKind.Context }) {
  items(m: MenuBuilder) {
    return [m.route(Routes.orders, { label: "web::nav.row" })];
  }
}

/** Registers the routes and menus and returns a wrapper at `path`, optionally right-to-left. */
async function setUp(path: string, dir: "ltr" | "rtl" = "ltr") {
  registerRoutes({ home: HomeRoute, orders: OrdersRoute, sales: SalesRoute });
  registerMenus({ orders_main: OrdersMenu, reports_main: ReportsMenu, orders_row: RowMenu });
  const container = await Container.create([]);
  return (children: ReactNode) => (
    <ContainerProvider container={container}>
      <MemoryRouter initialEntries={[path]}>
        <div dir={dir}>{children}</div>
      </MemoryRouter>
    </ContainerProvider>
  );
}

afterEach(() => {
  cleanup();
  ROUTE_TABLE.clear();
  MENU_REGISTRY.clear();
});

describe("ModuleMenu (web)", () => {
  it("draws the declared navigation menus as one named landmark, in order", async () => {
    const wrap = await setUp("/");
    render(wrap(<ModuleMenu label="Main navigation" />));
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "t:web::nav.home",
      "t:web::nav.orders",
      "t:web::nav.sales",
    ]);
    expect(links[1]?.getAttribute("href")).toBe("/orders");
    expect(within(nav).getByText("t:web::nav.reports")).toBeTruthy();
    expect(within(nav).queryByText("t:web::nav.beta")).toBeNull();
    expect(within(nav).queryByText("t:web::nav.row")).toBeNull();
  });

  it("marks the place under the current path, a home entry only on its exact path", async () => {
    const wrap = await setUp("/orders/ord_1");
    render(wrap(<ModuleMenu label="Main navigation" />));
    expect(screen.getByRole("link", { name: /web::nav.orders/ }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(screen.getByRole("link", { name: /web::nav.home/ }).getAttribute("aria-current")).toBe(
      null,
    );
  });

  it("draws `items` instead of the declared menus", async () => {
    const wrap = await setUp("/");
    render(
      wrap(
        <ModuleMenu label="Settings" items={[{ id: "profile", label: "Profile", href: "/me" }]} />,
      ),
    );
    const links = within(screen.getByRole("navigation", { name: "Settings" })).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Profile"]);
  });

  it("moves between the places with the arrow keys", async () => {
    const wrap = await setUp("/");
    render(wrap(<ModuleMenu label="Main navigation" />));
    const [home, orders] = within(screen.getByRole("navigation")).getAllByRole("link");
    act(() => home?.focus());
    fireEvent.keyDown(home as HTMLElement, { key: "ArrowDown" });
    expect(document.activeElement).toBe(orders);
  });

  it("keeps the layout on logical sides in Arabic", async () => {
    const wrap = await setUp("/", "rtl");
    const { container } = render(wrap(<ModuleMenu label="Main navigation" />));
    const panel = container.querySelector("[data-slot='sidebar-panel']");
    expect(panel?.className).toMatch(/\bstart-0\b/);
    expect(container.innerHTML).not.toMatch(
      /\b(left-|right-|ml-|mr-|pl-|pr-|text-left|text-right)/,
    );
  });
});
