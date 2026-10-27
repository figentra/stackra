/**
 * Stackra file contract:
 * Purpose: proves the BarChart page sits at /pro-bar-chart in the Pro category, titles the page and the document, and draws a grouped and a horizontal chart, each under a heading and named for screen readers, with a legend that names each series.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProBarChart } from "#src/routes/pro-bar-chart/pro-bar-chart";
import { ProBarChartRoute } from "#src/routes/pro-bar-chart/pro-bar-chart.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProBarChart", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-bar-chart in the Pro category, and titles the page and the document", () => {
    render(<ProBarChart />);
    expect(routePath(ProBarChartRoute)).toBe("/pro-bar-chart");
    expect(ProBarChartRoute.category).toBe("Charts");
    expect(screen.getByRole("heading", { level: 1, name: ProBarChartRoute.title })).toBeTruthy();
    expect(document.title).toBe("BarChart · Stackra Playground");
  });

  it("draws each chart under a heading, named for screen readers", () => {
    render(<ProBarChart />);
    expect(screen.getAllByRole("img").map((chart) => chart.getAttribute("aria-label"))).toEqual([
      "Bar chart of revenue by channel in dollars, January to June",
      "Horizontal bar chart of units sold by product this quarter",
    ]);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Revenue by channel", "Top products"]);
  });

  it("names each series in the legend", () => {
    render(<ProBarChart />);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Online",
      "Retail",
      "Direct",
    ]);
  });
});
