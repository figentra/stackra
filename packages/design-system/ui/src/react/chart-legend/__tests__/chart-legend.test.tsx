/**
 * Stackra file contract:
 * Purpose: proves the chart legend's toggles and the chart card options on the web charts: a legend entry is a toggle
 *          button that hides its series (`aria-pressed` false) and shows it again, a static legend stays plain text,
 *          a sorted bar chart writes its table in the new order, comparison adds the previous period's column and
 *          legend entry, and a reference line is read after the table.
 * Boundary: jsdom; Recharts measures nothing there, so the drawn plot is proven by the playground screenshots.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); WCAG 2.2 SC 4.1.2; STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";

import { BarChart } from "#react/bar-chart/bar-chart";
import { ChartLegend } from "#react/chart-legend/chart-legend";
import { LineChart } from "#react/line-chart/line-chart";

const SERIES = [
  { key: "desktop", label: "Desktop", compareKey: "lastDesktop" },
  { key: "mobile", label: "Mobile" },
];
const DATA = [
  { month: "Jan", desktop: 10, mobile: 5, lastDesktop: 8 },
  { month: "Feb", desktop: 30, mobile: 1, lastDesktop: 20 },
  { month: "Mar", desktop: 20, mobile: 2, lastDesktop: 25 },
];

/** The table's row headers, in order. */
const months = () =>
  within(screen.getByRole("table"))
    .getAllByRole("rowheader")
    .map((cell) => cell.textContent);

describe("ChartLegend (web)", () => {
  it("is plain text without a toggle", () => {
    render(<ChartLegend series={SERIES} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("toggles a chart's series from its legend", () => {
    render(<LineChart data={DATA} series={SERIES} xKey="month" label="Visitors" />);
    const desktop = screen.getByRole("button", { name: "Desktop" });
    expect(desktop.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(desktop);
    expect(desktop.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "Mobile" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    fireEvent.click(desktop);
    expect(desktop.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("chart card options (web)", () => {
  it("sorts bar categories by total or label", () => {
    const { rerender } = render(
      <BarChart data={DATA} series={SERIES} xKey="month" label="Visitors" sort="value-desc" />,
    );
    expect(months()).toEqual(["Feb", "Mar", "Jan"]);
    rerender(
      <BarChart data={DATA} series={SERIES} xKey="month" label="Visitors" sort="value-asc" />,
    );
    expect(months()).toEqual(["Jan", "Mar", "Feb"]);
    rerender(<BarChart data={DATA} series={SERIES} xKey="month" label="Visitors" sort="label" />);
    expect(months()).toEqual(["Feb", "Jan", "Mar"]);
  });

  it("adds the previous period to the table and legend, and reads references", () => {
    render(
      <LineChart
        data={DATA}
        series={SERIES}
        xKey="month"
        label="Visitors"
        showComparison
        references={[{ value: 25, label: "Target" }]}
      />,
    );
    expect(
      within(screen.getByRole("table"))
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Category", "Desktop", "Mobile", "Desktop, previous period"]);
    expect(screen.getByText("Previous period")).toBeTruthy();
    expect(screen.getByText("Target: 25")).toBeTruthy();
  });
});
