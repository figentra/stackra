/**
 * Stackra file contract:
 * Purpose: proves the RadialChart page sits at /pro-radial-chart in the Pro group, titles the page and the document, and draws rings and a gauge, each under a heading and named for screen readers, with the figures written beside the chart.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProRadialChart } from "#src/routes/pro-radial-chart/pro-radial-chart";
import { ProRadialChartRoute } from "#src/routes/pro-radial-chart/pro-radial-chart.route";

describe("ProRadialChart", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-radial-chart in the Pro group, and titles the page and the document", () => {
    render(<ProRadialChart />);
    expect(ProRadialChartRoute.path).toBe("/pro-radial-chart");
    expect(ProRadialChartRoute.group).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProRadialChartRoute.title })).toBeTruthy();
    expect(document.title).toBe("RadialChart · Stackra Playground");
  });

  it("draws each chart under a heading, named for screen readers", () => {
    render(<ProRadialChart />);
    expect(screen.getAllByRole("img").map((chart) => chart.getAttribute("aria-label"))).toEqual([
      "Radial chart of three daily goals: calories, steps and exercise",
      "Gauge of 780 active users out of 1,358",
    ]);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Daily activity", "Active users"]);
  });

  it("writes each goal's figure beside the rings and the gauge's figure in its middle", () => {
    render(<ProRadialChart />);
    expect(screen.getAllByRole("definition").map((figure) => figure.textContent)).toEqual([
      "1,623 of 2,000 kcal",
      "8,328 of 10,000 steps",
      "25 of 120 min",
    ]);
    expect(screen.getByText("of 1,358")).toBeTruthy();
  });
});
