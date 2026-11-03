/**
 * Stackra file contract:
 * Purpose: proves the web RouteProgress draws nothing while idle, shows a named busy progressbar whose row of 96 dots
 *          starts 8% lit and trickles forward without reaching the end while loading, the leading dot in the theme's
 *          core, fills every dot and fades when loading stops, then disappears, holds a still row with no fade under
 *          reduced motion, and can sit absolute in its parent.
 * Boundary: jsdom with fake timers; the motion level is a stand-in a test turns.
 * Runtime: browser
 * Governing contract: gap inventory row 29 (owner approval 2026-10-28); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-2017:FR-005
import { act, render, screen } from "@testing-library/react";

import { RouteProgress } from "#react/route-progress/route-progress";

/** The motion level the stand-in answers. */
const motion = vi.hoisted(() => ({ level: "full" }));

vi.mock("#react/design-system-provider/use-motion", () => ({ useMotion: () => motion.level }));

const dots = () => [
  ...screen.getByRole("progressbar").querySelectorAll<HTMLElement>('[data-slot="dot"]'),
];
const litCount = () => dots().filter((dot) => dot.hasAttribute("data-lit")).length;

describe("RouteProgress (web)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    motion.level = "full";
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
    // 8% of 96 dots, rounded up.
    expect(dots()).toHaveLength(96);
    expect(litCount()).toBe(8);
    act(() => vi.advanceTimersByTime(250 * 40));
    expect(litCount()).toBeGreaterThan(0.8 * 96);
    expect(litCount()).toBeLessThan(0.9 * 96);

    rerender(<RouteProgress isLoading={false} />);
    expect(litCount()).toBe(96);
    expect(screen.getByRole("progressbar").style.opacity).toBe("0");
    act(() => vi.advanceTimersByTime(300));
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  // @covers sta-2017:FR-005
  it("draws 2 px dots in the accent, the leading one in the theme's core", () => {
    render(<RouteProgress isLoading />);
    const grid = screen
      .getByRole("progressbar")
      .querySelector<HTMLElement>('[data-slot="dot-grid"]');
    expect(grid?.getAttribute("aria-hidden")).toBe("true");
    expect(grid?.style.color).toBe("var(--accent)");
    expect(dots()[0]?.style.inlineSize).toBe("2px");
    expect(dots()[0]?.style.blockSize).toBe("2px");
    expect(dots().findIndex((dot) => dot.style.background === "var(--core, var(--accent))")).toBe(
      litCount() - 1,
    );
  });

  // @covers sta-2017:FR-007
  it.each(["reduced", "none"])("holds a still row with no fade when motion is %s", (level) => {
    motion.level = level;
    render(<RouteProgress isLoading />);
    // The still fill is 90%: 87 of 96 dots, rounded up.
    expect(litCount()).toBe(87);
    act(() => vi.advanceTimersByTime(250 * 4));
    expect(litCount()).toBe(87);
    expect(screen.getByRole("progressbar").style.transition).toBe("none");
  });

  it("takes a label and sits absolute when not fixed", () => {
    render(<RouteProgress isLoading isFixed={false} label="Opening the report" />);
    expect(screen.getByRole("progressbar", { name: "Opening the report" }).className).toContain(
      "absolute",
    );
  });
});
