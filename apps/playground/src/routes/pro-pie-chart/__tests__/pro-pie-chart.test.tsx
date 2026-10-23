/**
 * Stackra file contract:
 * Purpose: proves the PieChart page sits at /pro-pie-chart in the Pro category, titles the page and the document, and draws a pie and a donut, each under a heading and named for screen readers, with a legend that names each slice and its value.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProPieChart } from "#src/routes/pro-pie-chart/pro-pie-chart";
import { ProPieChartRoute } from "#src/routes/pro-pie-chart/pro-pie-chart.route";

describe("ProPieChart", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-pie-chart in the Pro category, and titles the page and the document", () => {
    render(<ProPieChart />);
    expect(ProPieChartRoute.path).toBe("/pro-pie-chart");
    expect(ProPieChartRoute.category).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProPieChartRoute.title })).toBeTruthy();
    expect(document.title).toBe("PieChart · Stackra Playground");
  });

  it("draws each chart under a heading, named for screen readers", () => {
    render(<ProPieChart />);
    expect(screen.getAllByRole("img").map((chart) => chart.getAttribute("aria-label"))).toEqual([
      "Pie chart of browser usage in percent: Chrome, Safari, Firefox and Edge",
      "Donut chart of visits by source: Organic, Direct, Referral and Social",
    ]);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Browser usage", "Traffic sources"]);
  });

  it("names each slice with its value in the legends", () => {
    render(<ProPieChart />);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Chrome (62%)",
      "Safari (19%)",
      "Firefox (10%)",
      "Edge (9%)",
      "Organic (4,500)",
      "Direct (3,200)",
      "Referral (2,100)",
      "Social (1,400)",
    ]);
  });
});
