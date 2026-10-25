// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `Link`: a route ref with params and query renders an `<a>` to its href in the visitor's mount,
 *          a settings page and a string resolve too, and other props pass through.
 * Boundary: test only; jsdom with a memory data router and a container whose I18nConfig ships Saudi Arabic.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0303 (decision 1); ADR 0297 (decision 4).
 */
import { buildConfig } from "@stackra/config";
import { Container, type Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { I18nConfig, Locale } from "@stackra/i18n";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { Route } from "#core/bases/route.base";
import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import { registerRoutes } from "#core/functions/register-routes.function";
import { routeRef } from "#core/functions/route-ref.function";
import { Link } from "#react/link/link";

class ProductRoute extends Route({ path: "/store/:slug" }) {}
class StoreRoute extends Route({ path: "/store" }) {}

class SiteI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.ArSa];
}

/** Renders `element` at `path` under a container and a memory router. */
async function renderAt(path: string, element: ReactElement) {
  const container = await Container.create([], {
    overrides: new Map<Token, object>([[I18nConfig, buildConfig(SiteI18nConfig)]]),
  });
  const router = createMemoryRouter([{ path: "*", element }], { initialEntries: [path] });
  return render(
    <ContainerProvider container={container}>
      <RouterProvider router={router} />
    </ContainerProvider>,
  );
}

afterEach(() => {
  cleanup();
  ROUTE_TABLE.clear();
});

describe("Link", () => {
  it("links a route ref with params and query in the visitor's mount", async () => {
    registerRoutes({ product: ProductRoute, store: StoreRoute });
    await renderAt(
      "/ar-sa/store",
      <>
        <Link to={routeRef("product")} params={{ slug: "tee" }} className="link">
          Tee
        </Link>
        <Link to={routeRef("store")} search={{ collection: "summer" }}>
          Summer
        </Link>
      </>,
    );
    const tee = screen.getByRole("link", { name: "Tee" });
    expect(tee.getAttribute("href")).toBe("/ar-sa/store/tee");
    expect(tee.className).toBe("link");
    expect(screen.getByRole("link", { name: "Summer" }).getAttribute("href")).toBe(
      "/ar-sa/store?collection=summer",
    );
  });

  it("links a settings page and a string", async () => {
    const page = { key: "messages", scope: "user", panels: [], fields: [] } as never;
    await renderAt(
      "/",
      <>
        <Link to={page}>Messages</Link>
        <Link to="/ar-sa/pricing">Pricing</Link>
      </>,
    );
    expect(screen.getByRole("link", { name: "Messages" }).getAttribute("href")).toBe(
      "/settings/messages",
    );
    expect(screen.getByRole("link", { name: "Pricing" }).getAttribute("href")).toBe(
      "/ar-sa/pricing",
    );
  });
});
