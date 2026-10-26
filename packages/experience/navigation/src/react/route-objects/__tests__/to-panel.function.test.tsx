/**
 * Stackra file contract:
 * Purpose: unit tests of `toPanel`: the panel's recorded path with everything below it, the registered panel page
 *          rendered with the panel, and a panel with no path refused.
 * Boundary: test only; jsdom with a memory data router; a local kind stands in for `Panel({ path })`.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0307; ADR 0164.
 */
// @vitest-environment jsdom
import { createKind } from "@stackra/container";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { ROUTE_PAGES } from "#react/route-pages/route-pages.constant";
import { registerRoutePages } from "#react/route-pages/register-route-pages.function";
import { toPanel } from "#react/route-objects/to-panel.function";

/** A panel kind stand-in that records its path the way `Panel({ path })` will. */
// oxlint-disable-next-line typescript/no-extraneous-class -- reason: createKind needs a class; the stand-in base holds nothing
const PanelKind = createKind("panel", class PanelBase {}) as (options: {
  path: string;
}) => abstract new () => object;

class CustomerPortalPanel extends PanelKind({ path: "/portal" }) {}

afterEach(() => {
  cleanup();
  delete ROUTE_PAGES.panel;
});

describe("toPanel", () => {
  it("mounts the registered panel page at the panel's path", async () => {
    expect(toPanel(CustomerPortalPanel).path).toBe("portal/*");
    registerRoutePages({ panel: ({ panel }) => <p>{panel.name}</p> });
    const router = createMemoryRouter([toPanel(CustomerPortalPanel)], {
      initialEntries: ["/portal/orders"],
    });
    render(<RouterProvider router={router} />);
    expect(await screen.findByText("CustomerPortalPanel")).toBeTruthy();
  });

  it("refuses a panel with no path", () => {
    // oxlint-disable-next-line typescript/no-extraneous-class -- reason: a class that records no kind
    class Bare {}
    expect(() => toPanel(Bare)).toThrow(TypeError);
  });
});
