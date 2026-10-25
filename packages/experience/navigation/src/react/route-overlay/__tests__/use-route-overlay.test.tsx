/**
 * Stackra file contract:
 * Purpose: proves `useRouteOverlay()` hands back the controls the nearest overlay provides, and refuses to run outside
 *          one rather than doing nothing.
 * Boundary: jsdom; the context is provided by hand, so no router or dialog is involved.
 * Runtime: browser
 * Governing contract: ADR 0317 (decisions 2 and 9); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-179
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import type { RouteOverlayControls } from "#contracts/types/route-overlay-controls.type";
import { RouteOverlayContext } from "#react/route-overlay/route-overlay-context";
import { useRouteOverlay } from "#react/route-overlay/use-route-overlay";

describe("useRouteOverlay (web)", () => {
  it("returns the controls of the nearest overlay", () => {
    const controls: RouteOverlayControls = {
      close: vi.fn(),
      complete: vi.fn(),
      setDismissable: vi.fn(),
      isDismissable: true,
    };
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <RouteOverlayContext value={controls}>{children}</RouteOverlayContext>
    );
    const { result } = renderHook(() => useRouteOverlay(), { wrapper });
    expect(result.current).toBe(controls);
  });

  it("throws outside a RouteOverlay", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useRouteOverlay())).toThrow(/inside a RouteOverlay/);
    vi.restoreAllMocks();
  });
});
