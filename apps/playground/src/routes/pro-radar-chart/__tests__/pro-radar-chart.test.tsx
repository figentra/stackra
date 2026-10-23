/**
 * Stackra file contract:
 * Purpose: proves the RadarChart page sits at /pro-radar-chart in the Pro category, titles the page and the document, and draws a single and a two-series chart, each under a heading and named for screen readers, with a legend that names each team.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProRadarChart } from "#src/routes/pro-radar-chart/pro-radar-chart";
import { ProRadarChartRoute } from "#src/routes/pro-radar-chart/pro-radar-chart.route";

describe("ProRadarChart", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-radar-chart in the Pro category, and titles the page and the document", () => {
    render(<ProRadarChart />);
    expect(ProRadarChartRoute.path).toBe("/pro-radar-chart");
    expect(ProRadarChartRoute.category).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProRadarChartRoute.title })).toBeTruthy();
    expect(document.title).toBe("RadarChart · Stackra Playground");
  });

  it("draws each chart under a heading, named for screen readers", () => {
    render(<ProRadarChart />);
    expect(screen.getAllByRole("img").map((chart) => chart.getAttribute("aria-label"))).toEqual([
      "Radar chart of skill scores out of 100: design, frontend, backend, DevOps, testing and leadership",
      "Radar chart comparing Team A and Team B on six measures out of 100",
    ]);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Skill assessment", "Team comparison"]);
  });

  it("names each team in the legend", () => {
    render(<ProRadarChart />);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Team A",
      "Team B",
    ]);
  });
});
