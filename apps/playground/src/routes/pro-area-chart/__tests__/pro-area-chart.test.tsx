/**
 * Stackra file contract:
 * Purpose: proves the AreaChart page sits at /pro-area-chart in the Pro category, titles the page and the document, and draws a single and a stacked chart, each under a heading and named for screen readers, with a legend that names each stacked series.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProAreaChart } from "#src/routes/pro-area-chart/pro-area-chart";
import { ProAreaChartRoute } from "#src/routes/pro-area-chart/pro-area-chart.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProAreaChart", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-area-chart in the Pro category, and titles the page and the document", () => {
    render(<ProAreaChart />);
    expect(routePath(ProAreaChartRoute)).toBe("/pro-area-chart");
    expect(ProAreaChartRoute.category).toBe("Charts");
    expect(screen.getByRole("heading", { level: 1, name: ProAreaChartRoute.title })).toBeTruthy();
    expect(document.title).toBe("AreaChart · Stackra Playground");
  });

  it("draws each chart under a heading, named for screen readers", () => {
    render(<ProAreaChart />);
    expect(screen.getAllByRole("img").map((chart) => chart.getAttribute("aria-label"))).toEqual([
      "Area chart of monthly revenue in dollars, January to December",
      "Stacked area chart of monthly visits by source, January to June",
    ]);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Monthly revenue", "Traffic by source"]);
  });

  it("names each stacked series in its legend", () => {
    render(<ProAreaChart />);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Organic",
      "Paid ads",
      "Referral",
    ]);
  });
});
