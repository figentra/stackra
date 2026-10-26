/**
 * Stackra file contract:
 * Purpose: unit tests of `useHref`: a route ref's href in the current mount, unprefixed in the default mount, and
 *          unprefixed when the container binds no I18nConfig.
 * Boundary: test only; jsdom with Testing Library's `renderHook` under a memory router.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0297 (decision 4).
 */
// @vitest-environment jsdom
import { buildConfig } from "@stackra/config";
import { Container, type Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { I18nConfig, Locale } from "@stackra/i18n";
import { afterEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";

import { Route } from "#core/bases/route.base";
import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import { registerRoutes } from "#core/functions/register-routes.function";
import { routeRef } from "#core/functions/route-ref.function";
import { useHref } from "#react/href/use-href";

class SettingsRoute extends Route({ path: "/settings" }) {}

class ConsoleI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Ar];
}

/** A wrapper at `path`, with or without an I18nConfig. */
async function wrapperAt(path: string, withI18n = true) {
  const overrides = new Map<Token, object>(
    withI18n ? [[I18nConfig, buildConfig(ConsoleI18nConfig)]] : [],
  );
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

describe("useHref", () => {
  it("resolves in the current mount", async () => {
    registerRoutes({ settings: SettingsRoute });
    const ar = renderHook(() => useHref(routeRef("settings")), { wrapper: await wrapperAt("/ar") });
    expect(ar.result.current).toBe("/ar/settings");
    const en = renderHook(() => useHref(routeRef("settings")), { wrapper: await wrapperAt("/") });
    expect(en.result.current).toBe("/settings");
  });

  it("stays unprefixed without an I18nConfig", async () => {
    registerRoutes({ settings: SettingsRoute });
    const { result } = renderHook(() => useHref(routeRef("settings")), {
      wrapper: await wrapperAt("/ar", false),
    });
    expect(result.current).toBe("/settings");
  });
});
