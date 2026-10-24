/**
 * Stackra file contract:
 * Purpose: proves the LineChart page sits at /pro-line-chart in the Pro category, titles the page and the document, and draws two charts, each under a heading and named for screen readers, with a legend that names each series.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProLineChart } from "#src/routes/pro-line-chart/pro-line-chart";
import { ProLineChartRoute } from "#src/routes/pro-line-chart/pro-line-chart.route";

describe("ProLineChart", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-line-chart in the Pro category, and titles the page and the document", () => {
    render(<ProLineChart />);
    expect(ProLineChartRoute.path).toBe("/pro-line-chart");
    expect(ProLineChartRoute.category).toBe("Charts");
    expect(screen.getByRole("heading", { level: 1, name: ProLineChartRoute.title })).toBeTruthy();
    expect(document.title).toBe("LineChart · Stackra Playground");
  });

  it("draws each chart under a heading, named for screen readers", () => {
    render(<ProLineChart />);
    expect(screen.getAllByRole("img").map((chart) => chart.getAttribute("aria-label"))).toEqual([
      "Line chart of monthly sessions by source, January to December",
      "Line chart of monthly orders, this year as a solid line and last year as a dashed line",
    ]);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Traffic by source", "This year against last year"]);
  });

  it("names each series in the legend", () => {
    render(<ProLineChart />);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Organic",
      "Paid ads",
    ]);
  });
});
