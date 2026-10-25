/**
 * Stackra file contract:
 * Purpose: unit tests of `Dashboard`: the registered widgets of each slot, a widget the session may not read left out, a
 *          Band as one row and a Grid spanning each widget's columns, and an empty slot drawn as nothing.
 * Boundary: unit tier, jsdom; the tile is a stand-in that shows its widget's key, and the session is a stub.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 14 and 18 to 20).
 */
// @vitest-environment jsdom
import type { QueryRef } from "@stackra/clients";
import { ClientSession } from "@stackra/clients/contracts";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { ApiArea } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { WidgetDisplay } from "#core/constants/widget-display.constant";
import { Place } from "#core/enums/place.enum";
import { WidgetSize } from "#core/enums/widget-size.enum";
import { registerWidgets } from "#core/functions/register-widgets.function";
import { widget } from "#core/functions/widget.function";
import { Dashboard } from "#react/dashboard/dashboard";

vi.mock("#react/widget-tile/widget-tile", async () => {
  const { createElement } = await import("react");
  return {
    WidgetTile: (props: { readonly widget: { readonly key: string } }) =>
      createElement("p", null, props.widget.key),
  };
});

/** A consumed query ref stand-in. */
const OrderKpisQuery = Object.assign(function OrderKpisQuery() {}, {
  kind: "query",
  key: "orders.order.kpis@1",
  permission: "orders.order.read",
  input: {},
  output: {},
  invalidateOn: [],
}) as unknown as QueryRef;

/** A widget class stand-in. */
class WidgetStub {
  readonly isStub = true;
}

/** A session holding exactly `permissions`. */
class StubSession extends ClientSession {
  private readonly permissions: readonly string[];

  constructor(permissions: readonly string[]) {
    super();
    this.permissions = permissions;
  }

  headers(): Promise<Readonly<Record<string, string>>> {
    return Promise.resolve({});
  }

  can(permission: string): boolean {
    return this.permissions.includes(permission);
  }
}

const PANEL = { key: "admin", path: "/", area: ApiArea.Admin };
const HEADER = { key: "dashboard.header", place: Place.Band };
const MAIN = { key: "dashboard.main", place: Place.Grid };
const SHELL = { key: "shell.banner", place: Place.Banner };

afterEach(() => {
  cleanup();
  registerWidgets([]);
});

describe("Dashboard", () => {
  it("lays out each slot's permitted widgets", async () => {
    registerWidgets([
      widget(WidgetStub, {
        key: "orders.kpis",
        query: OrderKpisQuery,
        display: WidgetDisplay.kpi("revenue"),
        slot: HEADER,
      }),
      widget(WidgetStub, {
        key: "inventory.low",
        query: OrderKpisQuery,
        display: WidgetDisplay.list({ primary: "id" }),
        slot: MAIN,
        size: WidgetSize.Large,
        permission: "inventory.stock.read",
      }),
      widget(WidgetStub, {
        key: "orders.secret",
        query: OrderKpisQuery,
        display: WidgetDisplay.list({ primary: "id" }),
        slot: MAIN,
        permission: "orders.secret.read",
      }),
    ]);
    const container = await Container.create([], {
      overrides: new Map([[ClientSession, new StubSession(["inventory.stock.read"])]]),
    });
    const view = render(
      <ContainerProvider container={container}>
        <Dashboard panel={PANEL} slots={[HEADER, MAIN, SHELL]} overridable />
      </ContainerProvider>,
    );
    expect(screen.getByText("orders.kpis")).toBeTruthy();
    expect(screen.getByText("inventory.low").parentElement?.className).toBe("lg:col-span-9");
    expect(screen.queryByText("orders.secret")).toBeNull();
    expect(view.container.querySelector('[data-slot="shell.banner"]')).toBeNull();
  });
});
