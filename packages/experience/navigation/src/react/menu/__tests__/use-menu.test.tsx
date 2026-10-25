// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `useMenu`: the template's site menu is built through the container (its injected config),
 *          route entries get hrefs in the visitor's mount, and a flagged entry follows the container's `FlagReader`
 *          (its default without one).
 * Boundary: test only; jsdom with `renderHook` under a memory router; the flag reader is a local stand-in given as an
 *           override.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0294 (decisions 14 and 16); ADR 0214.
 */
import { buildConfig } from "@stackra/config";
import { Container, type Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { FlagReader, type FlagRef } from "@stackra/feature-flags";
import { I18nConfig, Locale } from "@stackra/i18n";
import { afterEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";

import { Menu } from "#core/bases/menu.base";
import { Route } from "#core/bases/route.base";
import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import { MenuKind } from "#core/enums/menu-kind.enum";
import { registerRoutes } from "#core/functions/register-routes.function";
import { routeRef } from "#core/functions/route-ref.function";
import type { MenuBuilder } from "#core/types/menu-builder.type";
import { useMenu } from "#react/menu/use-menu";

class LandingRoute extends Route({ path: "/" }) {}
class PageRoute extends Route({ path: "*" }) {}

const Routes = { landing: routeRef("landing"), page: routeRef("page") };
const helpCentre: FlagRef = {
  key: "web.help_centre",
  default: false,
  scopes: [],
  expires: null,
  removalIssue: null,
  label: "web::flags.help_centre.label",
};

/** A stand-in for the site config. */
class SiteConfig {
  readonly docsUrl = "https://docs.acme.test";
}

class SiteMenu extends Menu({ kind: MenuKind.Navigation }) {
  private readonly site: SiteConfig;

  constructor(site: SiteConfig) {
    super();
    this.site = site;
  }

  items(m: MenuBuilder) {
    return [
      m.route(Routes.landing, { label: "web::nav.home", end: true }),
      m.route(Routes.page, { label: "web::nav.help", params: { "*": "help" }, flag: helpCentre }),
      m.link("web::nav.docs", this.site.docsUrl, { external: true }),
    ];
  }
}

class SiteI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Ar];
}

/** A wrapper at `path` whose container binds the menu and, optionally, a flag reader. */
async function wrapperAt(path: string, flags?: Readonly<Record<string, boolean>>) {
  const overrides = new Map<Token, object>([
    [I18nConfig, buildConfig(SiteI18nConfig)],
    [SiteMenu, new SiteMenu(new SiteConfig())],
  ]);
  if (flags !== undefined)
    overrides.set(FlagReader, {
      get: (ref: FlagRef) => flags[ref.key] ?? ref.default,
      subscribe: () => () => undefined,
    });
  const container = await Container.create([], { overrides });
  return ({ children }: { children: ReactNode }) => (
    <ContainerProvider container={container}>
      <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
    </ContainerProvider>
  );
}

afterEach(() => {
  ROUTE_TABLE.clear();
});

describe("useMenu", () => {
  it("resolves the menu in the visitor's mount, a flagged entry hidden by its default", async () => {
    registerRoutes({ landing: LandingRoute, page: PageRoute });
    const { result } = renderHook(() => useMenu(SiteMenu), { wrapper: await wrapperAt("/ar") });
    expect(result.current).toEqual([
      { kind: "route", label: "web::nav.home", to: "/ar/", end: true },
      { kind: "link", label: "web::nav.docs", href: "https://docs.acme.test", external: true },
    ]);
  });

  it("shows a flagged entry the flag reader turns on", async () => {
    registerRoutes({ landing: LandingRoute, page: PageRoute });
    const { result } = renderHook(() => useMenu(SiteMenu), {
      wrapper: await wrapperAt("/", { "web.help_centre": true }),
    });
    expect(result.current.map((item) => item.label)).toEqual([
      "web::nav.home",
      "web::nav.help",
      "web::nav.docs",
    ]);
    expect(result.current[1]).toMatchObject({ to: "/help" });
  });
});
