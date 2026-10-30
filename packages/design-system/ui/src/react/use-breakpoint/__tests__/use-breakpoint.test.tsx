/**
 * Stackra file contract:
 * Purpose: proves the web useBreakpoint reports the window's breakpoint and size class, follows a resize across a
 *          breakpoint, and keeps the same object within one.
 * Boundary: jsdom; `window.innerWidth` is set and `resize` dispatched by hand.
 * Runtime: browser
 * Governing contract: design-system gap inventory row 20 (owner choice "P1 + P2 core", 2026-10-28); ADR 0022.
 */
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";

import { useBreakpoint } from "#react/use-breakpoint/use-breakpoint";

const resizeTo = (width: number) =>
  act(() => {
    window.innerWidth = width;
    window.dispatchEvent(new Event("resize"));
  });

describe("useBreakpoint (web)", () => {
  it("follows the window across breakpoints, the same object within one", () => {
    window.innerWidth = 390;
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toEqual({ breakpoint: undefined, sizeClass: "phone" });
    resizeTo(820);
    expect(result.current).toEqual({ breakpoint: "md", sizeClass: "tablet" });
    const tablet = result.current;
    resizeTo(1000);
    expect(result.current).toBe(tablet);
    resizeTo(1440);
    expect(result.current).toEqual({ breakpoint: "xl", sizeClass: "desktop" });
  });
});
