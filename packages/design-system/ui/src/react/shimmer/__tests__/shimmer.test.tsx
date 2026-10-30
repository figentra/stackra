/**
 * Stackra file contract:
 * Purpose: proves the web Shimmer says "Thinking…" (or the caller's words) in a status region painted through a
 *          gradient, sweeps in the reading direction (start of the gradient flipped in Arabic), is plain muted text
 *          under reduced motion, and draws the block kind as named Skeleton lines.
 * Boundary: jsdom with real HeroUI; `motion/react`'s reduced-motion hook is a switch the test turns.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { Shimmer } from "#react/shimmer/shimmer";

const state = vi.hoisted(() => ({ reduced: false }));

vi.mock("motion/react", async (original) => ({
  ...(await original<object>()),
  useReducedMotion: () => state.reduced,
}));

describe("Shimmer (web)", () => {
  beforeEach(() => {
    state.reduced = false;
  });

  it("paints the default words through a gradient in a status region", () => {
    render(<Shimmer />);
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("Thinking…");
    expect(status.className).toContain("bg-clip-text");
    expect(status.style.backgroundPosition).toBe("100% 0%");
  });

  it("starts the sweep from the right in Arabic", () => {
    render(
      <I18nProvider locale="ar">
        <Shimmer>Searching orders</Shimmer>
      </I18nProvider>,
    );
    expect(screen.getByRole("status").style.backgroundPosition).toBe("0% 0%");
  });

  it("is plain muted text under reduced motion", () => {
    state.reduced = true;
    render(<Shimmer>Searching orders</Shimmer>);
    const status = screen.getByRole("status");
    expect(status.className).not.toContain("bg-clip-text");
    expect(status.className).toContain("text-muted");
  });

  it("draws the block kind as named skeleton lines", () => {
    const { container } = render(<Shimmer kind="block" lines={4} />);
    expect(container.querySelectorAll(".skeleton")).toHaveLength(4);
    expect(screen.getByRole("status").textContent).toBe("Thinking…");
  });
});
