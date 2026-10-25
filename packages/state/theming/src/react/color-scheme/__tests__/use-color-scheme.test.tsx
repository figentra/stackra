// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useColorScheme()`: a client render reads the chosen and resolved scheme of the
 *          `ColorSchemeService` the nearest container binds and re-renders when the choice or the system preference
 *          changes; a server render shows the initial state whatever the device chose; it throws outside a provider or
 *          when nothing binds the service.
 * Boundary: test only; jsdom with React Testing Library for the client, react-dom/server for the server render.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0060; ADR 0295 (decision 10).
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { MemoryStorageDriver } from "@stackra/storage";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { ColorSchemeService, MemorySystemColorSchemeDriver, ThemingConfig } from "#core/index";
import type { ColorSchemeState } from "#core/index";
import { useColorScheme } from "#react/color-scheme/use-color-scheme";

/** Shows the chosen and resolved scheme, and toggles light and dark on click. */
function Toggle() {
  const scheme = useColorScheme();
  const isDark = scheme.resolved === "dark";
  return (
    <button type="button" onClick={() => scheme.setScheme(isDark ? "light" : "dark")}>
      {`${scheme.scheme}:${scheme.resolved}`}
    </button>
  );
}

/** A service over memory storage and a memory system preference, and a provider that binds it. */
async function setUp() {
  const system = new MemorySystemColorSchemeDriver();
  const service = new ColorSchemeService(
    buildConfig(ThemingConfig),
    new MemoryStorageDriver(),
    system,
  );
  const container = await Container.create([], {
    overrides: new Map([[ColorSchemeService, service]]),
  });
  const wrap = (children: ReactNode) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
  return { system, service, wrap };
}

describe("useColorScheme", () => {
  it("reads the service and re-renders on a choice and on a system change", async () => {
    const { system, service, wrap } = await setUp();
    render(wrap(<Toggle />));
    expect(screen.getByRole("button").textContent).toBe("system:light");
    act(() => system.set("dark"));
    expect(screen.getByRole("button").textContent).toBe("system:dark");
    act(() => screen.getByRole("button").click());
    expect(screen.getByRole("button").textContent).toBe("light:light");
    expect(service.scheme).toBe("light");
    expectTypeOf(useColorScheme).returns.toEqualTypeOf<ColorSchemeState>();
  });

  it("server-renders the initial state whatever the device chose", async () => {
    const { system, service, wrap } = await setUp();
    system.set("dark");
    service.setScheme("dark");
    expect(renderToString(wrap(<Toggle />))).toContain("system:light");
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderToString(<Toggle />)).toThrow(/ContainerProvider/);
  });

  it("throws when the container does not bind ColorSchemeService", async () => {
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <Toggle />
        </ContainerProvider>,
      ),
    ).toThrow(/ColorSchemeService/);
  });
});
