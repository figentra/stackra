/**
 * Stackra file contract:
 * Purpose: unit tests of `registerPanelPages`: after it, navigation's panel route renders the panel's shell for the
 *          class, framing the app's layout and below it the generic pages of the resources of its area and the documents
 *          whose route names it; every resource route renders the generic resource page with its page name; and its
 *          disposer takes the registration back.
 * Boundary: unit tier, jsdom; navigation's `toPanel` and `toResource` in a memory router are real, the shell, the
 *           resource page and the document page are recording stand-ins.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022 (test placement); ADR 0307; ADR 0164; build-list item 53 (STA-1981).
 */
// @vitest-environment jsdom
import { ApiArea } from "@stackra/contracts";
import { ExperienceKind } from "@stackra/experience/contracts";
import { toPanel, toResource } from "@stackra/navigation/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { vi } from "vitest";

import { Document } from "#core/bases/document.base";
import { Panel } from "#core/bases/panel.base";
import { document } from "#core/functions/document.function";
import { registerResources } from "#core/functions/register-resources.function";
import { resource } from "#core/functions/resource.function";
import type { ResourceTree } from "#core/types/resource-tree.type";
import { registerPanelPages } from "#react/route-pages/register-panel-pages.function";

const framed = vi.hoisted(() => [] as unknown[]);

vi.mock("#react/panel-shell/panel-shell", async () => {
  const { createElement } = await import("react");
  return {
    PanelShell: (props: { readonly panel: unknown; readonly children?: ReactNode }) => {
      framed.push(props.panel);
      return createElement("section", null, createElement("p", null, "shell"), props.children);
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

vi.mock("#react/document-page/document-page", async () => {
  const { createElement } = await import("react");
  return {
    DocumentPage: (props: { readonly route: { readonly key: string } }) =>
      createElement("p", null, `document:${props.route.key}`),
  };
});

// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a stand-in query ref, read by identity only
class ListOrdersQuery {}
// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a stand-in query ref, read by identity only
class GetOrderQuery {}
// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a stand-in query ref, read by identity only
class ListMembersQuery {}

const Orders = resource("orders.order", {
  base: "/orders/orders",
  list: ListOrdersQuery,
  view: GetOrderQuery,
});
const Members = resource("team.member", { base: "/team/members", list: ListMembersQuery });

class AdminPanel extends Panel({
  path: "/admin",
  area: ApiArea.Admin,
}) {}

class RootPanel extends Panel({
  path: "/",
  area: ApiArea.Admin,
}) {}

class SalesDocument extends Document({
  kind: ExperienceKind.Page,
  path: "/sales",
  blocks: [],
}) {}

const TREES = {
  "orders.order": { options: { area: ApiArea.Admin, operations: { list: ListOrdersQuery } } },
  "team.member": { options: { area: ApiArea.App, operations: { list: ListMembersQuery } } },
} as unknown as Readonly<Record<string, ResourceTree>>;

/** The app's layout stand-in: it draws the page inside. */
const Layout = ({ children }: { readonly children?: ReactNode }) => (
  <main>
    <p>layout</p>
    {children}
  </main>
);

/** Mounts the panel route of `panel` at `path`. */
const mount = (panel: typeof AdminPanel, path: string) =>
  render(
    <RouterProvider router={createMemoryRouter([toPanel(panel)], { initialEntries: [path] })} />,
  );

afterEach(() => {
  cleanup();
  framed.length = 0;
});

describe("registerPanelPages", () => {
  it("makes navigation's panel route render the panel's shell", async () => {
    const dispose = registerPanelPages();
    mount(AdminPanel, "/admin");
    expect(await screen.findByText("shell")).toBeTruthy();
    expect(framed[0]).toEqual({ key: "admin", path: "/admin", area: ApiArea.Admin });
    dispose();
  });

  it("frames the resources of its area below the shell, inside the app's layout", async () => {
    const trees = registerResources(TREES);
    const dispose = registerPanelPages({ resources: [Orders, Members], layout: Layout });
    mount(RootPanel, "/orders/orders/ord_1");
    expect(await screen.findByText("orders.order:view")).toBeTruthy();
    expect(screen.getByText("shell")).toBeTruthy();
    expect(screen.getByText("layout")).toBeTruthy();
    cleanup();
    // A resource of another area is not this panel's.
    mount(RootPanel, "/team/members");
    expect(await screen.findByText("layout")).toBeTruthy();
    expect(screen.queryByText("team.member:list")).toBeNull();
    dispose();
    trees();
  });

  it("mounts the documents whose route names the panel at their path", async () => {
    const admin = { key: "admin", path: "/admin", area: ApiArea.Admin };
    const dispose = registerPanelPages({
      documents: [
        {
          route: document("orders.sales", { path: "/sales", panel: admin }),
          document: SalesDocument,
        },
      ],
    });
    mount(AdminPanel, "/admin/sales");
    expect(await screen.findByText("document:orders.sales")).toBeTruthy();
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
    mount(AdminPanel, "/admin");
    // The router's error page repeats the message in its stack trace; the heading carries it alone.
    expect(
      await screen.findByRole("heading", { name: /No panel page is registered/ }),
    ).toBeTruthy();
    expect(framed).toEqual([]);
  });
});
