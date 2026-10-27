/**
 * Stackra file contract:
 * Purpose: unit tests of `registerPanelPages`: after it, navigation's panel route renders the panel's shell for the
 *          class, every resource route renders the generic resource page with its page name, and its disposer takes the
 *          registration back.
 * Boundary: unit tier, jsdom; navigation's `toPanel` and `toResource` in a memory router are real, the shell and the
 *           resource page are recording stand-ins.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022 (test placement); ADR 0307; ADR 0164.
 */
// @vitest-environment jsdom
import { ApiArea } from "@stackra/contracts";
import { toPanel, toResource } from "@stackra/navigation/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { vi } from "vitest";

import { Panel } from "#core/bases/panel.base";
import { resource } from "#core/functions/resource.function";
import { registerPanelPages } from "#react/route-pages/register-panel-pages.function";

const framed = vi.hoisted(() => [] as unknown[]);

vi.mock("#react/panel-shell/panel-shell", async () => {
  const { createElement } = await import("react");
  return {
    PanelShell: (props: { readonly panel: unknown }) => {
      framed.push(props.panel);
      return createElement("p", null, "shell");
    },
  };
});

vi.mock("#react/resource-pages/resource-route-page", async () => {
  const { createElement } = await import("react");
  return {
    ResourceRoutePage: (props: {
      readonly resource: { readonly key: string };
      readonly page: string;
    }) => createElement("p", null, `${props.resource.key}:${props.page}`),
  };
});

// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a stand-in query ref, read by identity only
class ListOrdersQuery {}
// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a stand-in query ref, read by identity only
class GetOrderQuery {}

const Orders = resource("orders.order", {
  base: "/orders/orders",
  list: ListOrdersQuery,
  view: GetOrderQuery,
});

class AdminPanel extends Panel({
  path: "/admin",
  area: ApiArea.Admin,
}) {}

/** Mounts the panel route at its path. */
const mount = () =>
  render(
    <RouterProvider
      router={createMemoryRouter([toPanel(AdminPanel)], { initialEntries: ["/admin"] })}
    />,
  );

afterEach(() => {
  cleanup();
  framed.length = 0;
});

describe("registerPanelPages", () => {
  it("makes navigation's panel route render the panel's shell", async () => {
    const dispose = registerPanelPages();
    mount();
    expect(await screen.findByText("shell")).toBeTruthy();
    expect(framed[0]).toEqual({ key: "admin", path: "/admin", area: ApiArea.Admin });
    dispose();
  });

  it("makes every resource route render the generic resource page", async () => {
    const dispose = registerPanelPages();
    render(
      <RouterProvider
        router={createMemoryRouter(toResource(Orders), {
          initialEntries: ["/orders/orders/ord_1"],
        })}
      />,
    );
    expect(await screen.findByText("orders.order:view")).toBeTruthy();
    dispose();
  });

  it("takes the registration back with its disposer", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    registerPanelPages()();
    mount();
    // The router's error page repeats the message in its stack trace; the heading carries it alone.
    expect(
      await screen.findByRole("heading", { name: /No panel page is registered/ }),
    ).toBeTruthy();
    expect(framed).toEqual([]);
  });
});
