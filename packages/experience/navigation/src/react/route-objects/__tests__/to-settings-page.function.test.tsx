/**
 * Stackra file contract:
 * Purpose: unit tests of `toSettingsPage`: the page is routed at `/settings/<key-kebab>` and renders the registered
 *          settings page with the page.
 * Boundary: test only; jsdom with a memory data router; the settings page is a local stand-in.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0307 (rule 24).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { ROUTE_PAGES } from "#react/route-pages/route-pages.constant";
import { registerRoutePages } from "#react/route-pages/register-route-pages.function";
import { toSettingsPage } from "#react/route-objects/to-settings-page.function";

const loyaltyKit = { key: "loyalty_kit", scope: "tenant", panels: [], fields: [] } as never;

afterEach(() => {
  cleanup();
  delete ROUTE_PAGES.settings;
});

describe("toSettingsPage", () => {
  it("routes the page at /settings/<key-kebab> with the registered form", async () => {
    expect(toSettingsPage(loyaltyKit).map((route) => route.path)).toEqual(["settings/loyalty-kit"]);
    registerRoutePages({ settings: ({ page }) => <p>{`form ${page.key}`}</p> });
    const router = createMemoryRouter(toSettingsPage(loyaltyKit), {
      initialEntries: ["/settings/loyalty-kit"],
    });
    render(<RouterProvider router={router} />);
    expect(await screen.findByText("form loyalty_kit")).toBeTruthy();
  });
});
