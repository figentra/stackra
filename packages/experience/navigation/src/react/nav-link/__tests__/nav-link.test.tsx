/**
 * Stackra file contract:
 * Purpose: unit tests of `NavLink`: the current route's link is `aria-current="page"` with its active class, `end`
 *          keeps a home link inactive below it, and the href is the visitor's mount's.
 * Boundary: test only; jsdom with a memory data router and a container binding the default I18nConfig.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0303 (decision 1); WCAG 2.2 SC 2.4.8.
 */
// @vitest-environment jsdom
import { buildConfig } from "@stackra/config";
import { Container, type Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { I18nConfig } from "@stackra/i18n";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { Route } from "#core/bases/route.base";
import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import { registerRoutes } from "#core/functions/register-routes.function";
import { routeRef } from "#core/functions/route-ref.function";
import { NavLink } from "#react/nav-link/nav-link";

class LandingRoute extends Route({ path: "/" }) {}
class PricingRoute extends Route({ path: "/pricing" }) {}

afterEach(() => {
  cleanup();
  ROUTE_TABLE.clear();
});

describe("NavLink", () => {
  it("marks the current page and keeps an exact home link inactive below it", async () => {
    registerRoutes({ landing: LandingRoute, pricing: PricingRoute });
    const container = await Container.create([], {
      overrides: new Map<Token, object>([[I18nConfig, buildConfig(I18nConfig)]]),
    });
    const element = (
      <nav>
        <NavLink to={routeRef("landing")} end>
          Home
        </NavLink>
        <NavLink
          to={routeRef("pricing")}
          className={({ isActive }) => (isActive ? "font-medium" : "text-ink-muted")}
        >
          Pricing
        </NavLink>
      </nav>
    );
    const router = createMemoryRouter([{ path: "*", element }], { initialEntries: ["/pricing"] });
    render(
      <ContainerProvider container={container}>
        <RouterProvider router={router} />
      </ContainerProvider>,
    );
    const pricing = screen.getByRole("link", { name: "Pricing" });
    expect(pricing.getAttribute("aria-current")).toBe("page");
    expect(pricing.className).toBe("font-medium");
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBeNull();
  });
});
