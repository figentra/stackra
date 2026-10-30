/**
 * Stackra file contract:
 * Purpose: proves the native useBreakpoint reports the window width's breakpoint and size class, the same rule as the
 *          web: a phone, a portrait counter tablet and a landscape one.
 * Boundary: `react-native`'s `useWindowDimensions` is replaced by a stand-in whose width each test sets.
 * Runtime: node
 * Governing contract: design-system gap inventory row 20 (owner choice "P1 + P2 core", 2026-10-28); ADR 0022.
 */
// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";

import { useBreakpoint } from "#native/use-breakpoint/use-breakpoint";

const state = vi.hoisted(() => ({ width: 390 }));

vi.mock("react-native", () => ({
  useWindowDimensions: () => ({ width: state.width, height: 800, scale: 2, fontScale: 1 }),
}));

describe("useBreakpoint (native)", () => {
  it.each([
    [390, undefined, "phone"],
    [820, "md", "tablet"],
    [1180, "lg", "desktop"],
  ] as const)("a %i-point window is %s, a %s", (width, breakpoint, sizeClass) => {
    state.width = width;
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toEqual({ breakpoint, sizeClass });
  });
});
