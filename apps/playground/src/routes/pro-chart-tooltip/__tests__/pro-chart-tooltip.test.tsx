/**
 * Stackra file contract:
 * Purpose: proves the ChartTooltip page sits at /pro-chart-tooltip in the Pro category, titles the page and the document, and draws the card on its own, with its header and one row per series, and a chart that shows it.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProChartTooltip } from "#src/routes/pro-chart-tooltip/pro-chart-tooltip";
import { ProChartTooltipRoute } from "#src/routes/pro-chart-tooltip/pro-chart-tooltip.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProChartTooltip", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-chart-tooltip in the Pro category, and titles the page and the document", () => {
    render(<ProChartTooltip />);
    expect(routePath(ProChartTooltipRoute)).toBe("/pro-chart-tooltip");
    expect(ProChartTooltipRoute.category).toBe("Charts");
    expect(
      screen.getByRole("heading", { level: 1, name: ProChartTooltipRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("ChartTooltip · Stackra Playground");
  });

  it("draws the card on its own: a header and one row per series with its label and value", () => {
    render(<ProChartTooltip />);
    expect(screen.getByText("January")).toBeTruthy();
    expect(screen.getByText("Revenue").parentElement?.textContent).toBe("Revenue$12,400");
    expect(screen.getByText("Expenses").parentElement?.textContent).toBe("Expenses$8,200");
  });

  it("draws a named chart that carries the card as its tooltip", () => {
    render(<ProChartTooltip />);
    expect(
      screen.getByRole("img", {
        name: "Bar chart of revenue and expenses in dollars, January to April",
      }),
    ).toBeTruthy();
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["On its own", "Inside a chart"]);
  });
});
