/**
 * Stackra file contract:
 * Purpose: proves the ComposedChart page sits at /pro-composed-chart in the Pro group, titles the page and the document, and draws two charts, each under a heading and named for screen readers, with a legend that names each series.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProComposedChart } from "#src/routes/pro-composed-chart/pro-composed-chart";
import { ProComposedChartRoute } from "#src/routes/pro-composed-chart/pro-composed-chart.route";

describe("ProComposedChart", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-composed-chart in the Pro group, and titles the page and the document", () => {
    render(<ProComposedChart />);
    expect(ProComposedChartRoute.path).toBe("/pro-composed-chart");
    expect(ProComposedChartRoute.group).toBe("Pro");
    expect(
      screen.getByRole("heading", { level: 1, name: ProComposedChartRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("ComposedChart · Stackra Playground");
  });

  it("draws each chart under a heading, named for screen readers", () => {
    render(<ProComposedChart />);
    expect(screen.getAllByRole("img").map((chart) => chart.getAttribute("aria-label"))).toEqual([
      "Chart of monthly revenue in dollars as columns on the left scale and orders as a line on the right scale",
      "Chart of weekly visits as an area and sign-ups as a line",
    ]);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Revenue and orders", "Visits and sign-ups"]);
  });

  it("names each series in the legends", () => {
    render(<ProComposedChart />);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Revenue",
      "Orders",
      "Visits",
      "Sign-ups",
    ]);
  });
});
