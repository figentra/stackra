/**
 * Stackra file contract:
 * Purpose: proves the native ModuleMenu hands the NavigationList every declared navigation menu, in registry order,
 *          as places named by `label`: route entries with their app paths and translated labels, a group as a heading
 *          over its rows, a context menu and an entry behind a flag that is off left out; `items` replaces the
 *          declared menus; extra props pass through; and the order holds under `dir="rtl"`.
 * Boundary: unit tier, jsdom. React Native does not render in vitest, so `@stackra/ui/native` is replaced by a DOM
 *           stand-in that keeps the NavigationList's contract (a named navigation landmark, links for places, text for
 *           headings); the translator echoes the key. The container and the registries are real.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0111 (decisions 1 and 3); ADR 0317 (decisions 1 and 7); ADR 0060.
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import type { FlagRef } from "@stackra/feature-flags";
import type { NavigationItem } from "@stackra/ui/contracts";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
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
import { ModuleMenu } from "#native/module-menu/module-menu";

vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => ({ t: (key: string) => `t:${key}` }),
}));

vi.mock("@stackra/ui/native", async () => {
  const { createElement } = await import("react");
  /** The stand-in's rows: a link for a place, text for a heading, then the nested rows. */
  const rows = (items: readonly NavigationItem[]): ReactNode[] =>
    items.map((item) =>
      createElement(
        "div",
        { key: item.id },
        item.href === undefined
          ? createElement("span", null, item.label)
          : createElement("a", { href: item.href }, item.label),
        rows(item.children ?? []),
      ),
    );
  return {
    NavigationList: ({
      items,
      label,
      testID,
    }: {
      items: readonly NavigationItem[];
      label?: string;
      testID?: string;
    }) => createElement("nav", { "aria-label": label, "data-testid": testID }, rows(items)),
  };
});

class OrdersRoute extends Route({ path: "/orders" }) {}
class SalesRoute extends Route({ path: "/reports/sales" }) {}

const Routes = { orders: routeRef("orders"), sales: routeRef("sales") };

const beta: FlagRef = {
  key: "mobile.beta_reports",
  default: false,
  scopes: [],
  expires: null,
  removalIssue: null,
  label: "mobile::flags.beta_reports.label",
};

class OrdersMenu extends Menu({ kind: MenuKind.Navigation }) {
  items(m: MenuBuilder) {
    return [m.route(Routes.orders, { label: "mobile::nav.orders", icon: "check" })];
  }
}

class ReportsMenu extends Menu({ kind: MenuKind.Navigation }) {
  items(m: MenuBuilder) {
    return [
      m.group("mobile::nav.reports", [m.route(Routes.sales, { label: "mobile::nav.sales" })]),
      m.route(Routes.orders, { label: "mobile::nav.beta", flag: beta }),
    ];
  }
}

class RowMenu extends Menu({ kind: MenuKind.Context }) {
  items(m: MenuBuilder) {
    return [m.route(Routes.orders, { label: "mobile::nav.row" })];
  }
}

/** Registers the routes and menus and returns a wrapper, optionally right-to-left. */
async function setUp(dir: "ltr" | "rtl" = "ltr") {
  registerRoutes({ orders: OrdersRoute, sales: SalesRoute });
  registerMenus({ orders_main: OrdersMenu, reports_main: ReportsMenu, orders_row: RowMenu });
  const container = await Container.create([]);
  return (children: ReactNode) => (
    <ContainerProvider container={container}>
      <div dir={dir}>{children}</div>
    </ContainerProvider>
  );
}

afterEach(() => {
  cleanup();
  ROUTE_TABLE.clear();
  MENU_REGISTRY.clear();
});

describe("ModuleMenu (native)", () => {
  it("lists the declared navigation menus as named places, in order", async () => {
    const wrap = await setUp();
    render(wrap(<ModuleMenu label="Main navigation" />));
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["t:mobile::nav.orders", "/orders"],
      ["t:mobile::nav.sales", "/reports/sales"],
    ]);
    expect(within(nav).getByText("t:mobile::nav.reports")).toBeTruthy();
    expect(within(nav).queryByText("t:mobile::nav.beta")).toBeNull();
    expect(within(nav).queryByText("t:mobile::nav.row")).toBeNull();
  });

  it("draws `items` instead of the declared menus and passes extra props on", async () => {
    const wrap = await setUp();
    render(
      wrap(
        <ModuleMenu
          label="Settings"
          testID="settings-menu"
          items={[{ id: "profile", label: "Profile", href: "/me" }]}
        />,
      ),
    );
    const nav = screen.getByTestId("settings-menu");
    expect(nav.getAttribute("aria-label")).toBe("Settings");
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Profile"]);
  });

  it("keeps the declared order under right-to-left", async () => {
    const wrap = await setUp("rtl");
    render(wrap(<ModuleMenu label="Main navigation" />));
    const links = within(screen.getByRole("navigation")).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "t:mobile::nav.orders",
      "t:mobile::nav.sales",
    ]);
  });
});
