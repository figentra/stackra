/**
 * Stackra file contract:
 * Purpose: proves the TrendChip page sits at /pro-trend-chip in the Pro group, titles the page and the document,
 *          draws every direction in every size and every variant, and names each chip's direction in words.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0304 (decision 6); ADR 0022 (test placement).
 */
// @covers sta-403:FR-013
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProTrendChip } from "#src/routes/pro-trend-chip/pro-trend-chip";
import { ProTrendChipRoute } from "#src/routes/pro-trend-chip/pro-trend-chip.route";

const chips = (selector = "") => [...document.querySelectorAll(`[data-trend]${selector}`)];

describe("ProTrendChip", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-trend-chip in the Pro group, and titles the page and the document", () => {
    render(<ProTrendChip />);
    expect(ProTrendChipRoute.path).toBe("/pro-trend-chip");
    expect(ProTrendChipRoute.group).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProTrendChipRoute.title })).toBeTruthy();
    expect(document.title).toBe("TrendChip · Stackra Playground");
  });

  it("draws up, down and neutral in each of the three sizes", () => {
    render(<ProTrendChip />);
    for (const size of ["sm", "md", "lg"])
      for (const trend of ["up", "down", "neutral"])
        expect(
          chips(`[data-trend="${trend}"].chip--${size}`).length,
          `${trend} in ${size}`,
        ).toBeGreaterThan(0);
  });

  it("draws every direction in each of the four variants", () => {
    render(<ProTrendChip />);
    for (const variant of ["soft", "primary", "secondary", "tertiary"])
      for (const trend of ["up", "down", "neutral"])
        expect(
          chips(`[data-trend="${trend}"].chip--${variant}`).length,
          `${trend} as ${variant}`,
        ).toBeGreaterThan(0);
  });

  it("names the direction of every chip in words", () => {
    render(<ProTrendChip />);
    const words = { up: "Trending up", down: "Trending down", neutral: "No change" } as const;
    expect(chips()).not.toHaveLength(0);
    for (const chip of chips()) {
      const trend = chip.getAttribute("data-trend") as keyof typeof words;
      expect(chip.textContent, trend).toContain(words[trend]);
    }
    expect(screen.getAllByText("Trending down").length).toBeGreaterThan(0);
  });

  it("draws the prefix and the suffix", () => {
    render(<ProTrendChip />);
    expect(screen.getByText("+$")).toBeTruthy();
    expect(screen.getByText("vs last month", { exact: false })).toBeTruthy();
  });
});
