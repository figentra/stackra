// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `toResource`: only the pages a resource declares are routed under its base, and the
 *          registered resource page renders with the resource and the page kind.
 * Boundary: test only; jsdom with a memory data router; the resources are local stand-ins.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0307; ADR 0164.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { ROUTE_PAGES } from "#react/route-pages/route-pages.constant";
import { registerRoutePages } from "#react/route-pages/register-route-pages.function";
import { toResource } from "#react/route-objects/to-resource.function";

const Order = { base: "/orders/orders", list: {}, view: {} };
const ProductCollection = { base: "/catalogue/collections", list: {}, create: {}, edit: {} };

afterEach(() => {
  cleanup();
  delete ROUTE_PAGES.resource;
});

describe("toResource", () => {
  it("routes only the pages a resource declares", () => {
    expect(toResource(Order).map((route) => route.path)).toEqual([
      "orders/orders",
      "orders/orders/:id",
    ]);
    expect(toResource(ProductCollection).map((route) => route.path)).toEqual([
      "catalogue/collections",
      "catalogue/collections/new",
      "catalogue/collections/:id/edit",
    ]);
  });

  it("renders the registered resource page with the page kind", async () => {
    registerRoutePages({ resource: ({ page }) => <p>{`resource ${page}`}</p> });
    const router = createMemoryRouter(toResource(Order), {
      initialEntries: ["/orders/orders/ord_1"],
    });
    render(<RouterProvider router={router} />);
    expect(await screen.findByText("resource view")).toBeTruthy();
  });
});
