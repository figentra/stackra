// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of the web `useNavigate`: a route ref goes to its href in the current mount, a string is followed
 *          as it is, and `replace` replaces the history entry.
 * Boundary: test only; jsdom with a memory data router whose location the test reads.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0303 (decision 1); ADR 0297 (decision 4).
 */
import { buildConfig } from "@stackra/config";
import { Container, type Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { I18nConfig, Locale } from "@stackra/i18n";
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { useEffect } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { Route } from "#core/bases/route.base";
import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import { registerRoutes } from "#core/functions/register-routes.function";
import { routeRef } from "#core/functions/route-ref.function";
import type { NavigateOptions } from "#react/navigate/navigate-options.type";
import { useNavigate } from "#react/navigate/use-navigate";

class SettingsRoute extends Route({ path: "/settings" }) {}

class ConsoleI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Ar];
}

/** The navigate function the probe hands out. */
type Navigate = (
  to: Parameters<ReturnType<typeof useNavigate>>[0],
  options?: NavigateOptions,
) => void;

/** Hands the navigate function to `onReady`. */
function Probe({ onReady }: { readonly onReady: (navigate: Navigate) => void }) {
  const navigate = useNavigate();
  useEffect(() => onReady(navigate), [navigate, onReady]);
  return null;
}

afterEach(() => {
  cleanup();
  ROUTE_TABLE.clear();
});

describe("useNavigate", () => {
  it("goes to a route ref in the current mount and follows a string", async () => {
    registerRoutes({ settings: SettingsRoute });
    const container = await Container.create([], {
      overrides: new Map<Token, object>([[I18nConfig, buildConfig(ConsoleI18nConfig)]]),
    });
    let navigate: Navigate | undefined;
    const keep = (next: Navigate) => {
      navigate = next;
    };
    const router = createMemoryRouter([{ path: "*", element: <Probe onReady={keep} /> }], {
      initialEntries: ["/ar/orders"],
    });
    render(
      <ContainerProvider container={container}>
        <RouterProvider router={router} />
      </ContainerProvider>,
    );
    act(() => navigate?.(routeRef("settings"), { hash: "pending-changes" }));
    expect(router.state.location.pathname).toBe("/ar/settings");
    expect(router.state.location.hash).toBe("#pending-changes");
    act(() => navigate?.("/ar/inbox", { replace: true }));
    expect(router.state.location.pathname).toBe("/ar/inbox");
    expect(router.state.historyAction).toBe("REPLACE");
  });
});
