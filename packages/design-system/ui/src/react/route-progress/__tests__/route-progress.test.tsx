/**
 * Stackra file contract:
 * Purpose: proves the web RouteProgress draws nothing while idle, shows a named busy progressbar that starts at 8% and
 *          trickles forward without reaching the end while loading, fills to 100% and fades when loading stops, then
 *          disappears, and can sit absolute in its parent.
 * Boundary: jsdom with fake timers; no matchMedia, so motion is not reduced.
 * Runtime: browser
 * Governing contract: gap inventory row 29 (owner approval 2026-10-28); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";

import { RouteProgress } from "#react/route-progress/route-progress";

const fillWidth = () =>
  Number.parseFloat(
    screen.getByRole("progressbar").querySelector<HTMLElement>("div")?.style.width ?? "0",
  );

describe("RouteProgress (web)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("trickles while loading, fills and fades when done, then goes", () => {
    const { rerender } = render(<RouteProgress isLoading={false} />);
    expect(screen.queryByRole("progressbar")).toBeNull();

    rerender(<RouteProgress isLoading />);
    const bar = screen.getByRole("progressbar", { name: "Loading page" });
    expect(bar.getAttribute("aria-busy")).toBe("true");
    expect(bar.className).toContain("fixed");
    expect(fillWidth()).toBeCloseTo(8);
    act(() => vi.advanceTimersByTime(250 * 40));
    expect(fillWidth()).toBeGreaterThan(80);
    expect(fillWidth()).toBeLessThan(90);

    rerender(<RouteProgress isLoading={false} />);
    expect(fillWidth()).toBe(100);
    expect(screen.getByRole("progressbar").style.opacity).toBe("0");
    act(() => vi.advanceTimersByTime(300));
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("takes a label and sits absolute when not fixed", () => {
    render(<RouteProgress isLoading isFixed={false} label="Opening the report" />);
    expect(screen.getByRole("progressbar", { name: "Opening the report" }).className).toContain(
      "absolute",
    );
  });
});
