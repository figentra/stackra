/**
 * Stackra file contract:
 * Purpose: unit tests of `useRouteReload`: inside a screen it is the screen's reload; outside one it throws.
 * Boundary: test only; the screen's context is provided directly.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0294 (decision 16).
 */
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { RouteReloadContext } from "#native/route-reload/route-reload-context";
import { useRouteReload } from "#native/route-reload/use-route-reload";

describe("useRouteReload", () => {
  it("is the screen's reload", () => {
    const reload = { run: async () => undefined, isRunning: true };
    const { result } = renderHook(() => useRouteReload(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <RouteReloadContext value={reload}>{children}</RouteReloadContext>
      ),
    });
    expect(result.current).toBe(reload);
  });

  it("throws outside a screen", () => {
    expect(() => renderHook(() => useRouteReload())).toThrow(/toScreen/);
  });
});
