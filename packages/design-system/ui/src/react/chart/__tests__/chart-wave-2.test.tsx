/**
 * Stackra file contract:
 * Purpose: proves the second wave of web charts give their numbers to assistive technology: the scatter chart's
 *          points, the heatmap's grid, the calendar's days, the gauge as a meter with its target, the waterfall's
 *          changes and totals, and the candlestick's prices, each in the locale.
 * Boundary: jsdom; Recharts measures nothing there, so the drawn plots are proven by the playground screenshots.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); WCAG 2.2 SC 1.1.1 and 4.1.2; STA-1371.
 */
// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { CalendarHeatmap } from "#react/calendar-heatmap/calendar-heatmap";
import { CandlestickChart } from "#react/candlestick-chart/candlestick-chart";
import { GaugeChart } from "#react/gauge-chart/gauge-chart";
import { HeatmapChart } from "#react/heatmap-chart/heatmap-chart";
import { ScatterChart } from "#react/scatter-chart/scatter-chart";
import { WaterfallChart } from "#react/waterfall-chart/waterfall-chart";

const rowsOf = () =>
  within(screen.getByRole("table"))
    .getAllByRole("row")
    .map((row) => row.textContent);

describe("second chart wave (web)", () => {
  it("ScatterChart lists every point with its group, both numbers and its size", () => {
    render(
      <ScatterChart
        data={[
          { g: "a", x: 10, y: 1200, s: 5 },
          { g: "b", x: 20, y: 300, s: 9 },
        ]}
        series={[
          { key: "a", label: "Drinks" },
          { key: "b", label: "Food" },
        ]}
        groupKey="g"
        xKey="x"
        yKey="y"
        sizeKey="s"
        xLabel="Price"
        yLabel="Units"
        sizeLabel="Revenue"
        label="Products"
      />,
    );
    expect(rowsOf()).toEqual(["GroupPriceUnitsRevenue", "Drinks101,2005", "Food203009"]);
    expect(screen.getByRole("button", { name: "Food" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("HeatmapChart writes its grid as a table", () => {
    render(
      <HeatmapChart
        data={[
          { day: "Mon", hour: "09", n: 3 },
          { day: "Mon", hour: "10", n: 1200 },
          { day: "Tue", hour: "09", n: 0 },
        ]}
        xKey="hour"
        yKey="day"
        valueKey="n"
        label="Orders"
      />,
    );
    expect(rowsOf()).toEqual(["Category0910", "Mon31,200", "Tue0"]);
    expect(screen.getByRole("img", { name: "Orders" })).toBeTruthy();
  });

  it("CalendarHeatmap lists the days that have a value", () => {
    render(
      <CalendarHeatmap
        values={[
          { date: "2026-10-01", value: 4 },
          { date: "2026-10-03", value: 9 },
        ]}
        start="2026-10-01"
        end="2026-10-07"
        label="Orders per day"
      />,
    );
    expect(rowsOf()).toEqual(["CategoryValue", "Thu, Oct 14", "Sat, Oct 39"]);
  });

  it("GaugeChart is a meter that says its value against the target", () => {
    render(<GaugeChart value={72} target={80} label="Sales" />);
    const meter = screen.getByRole("meter", { name: "Sales" });
    expect(meter.getAttribute("aria-valuenow")).toBe("72");
    expect(meter.getAttribute("aria-valuemax")).toBe("100");
    expect(meter.getAttribute("aria-valuetext")).toBe("72 of 80");
  });

  it("WaterfallChart writes each change with its sign and the running total", () => {
    render(
      <WaterfallChart
        start={{ label: "Q3", value: 100 }}
        steps={[
          { key: "a", label: "New", value: 30 },
          { key: "b", label: "Lost", value: -50 },
        ]}
        endLabel="Q4"
        label="Profit"
      />,
    );
    expect(rowsOf()).toEqual(["CategoryChangeTotal", "Q3100", "New+30130", "Lost-5080", "Q480"]);
  });

  it("CandlestickChart writes each period's prices and volume, in Arabic digits when asked", () => {
    render(
      <I18nProvider locale="ar-u-nu-arab">
        <CandlestickChart
          data={[{ date: "D1", open: 10, high: 12, low: 9, close: 11, volume: 1500 }]}
          label="Price"
        />
      </I18nProvider>,
    );
    expect(rowsOf()[1]).toContain("١٠");
    expect(within(screen.getByRole("table")).getAllByRole("columnheader")).toHaveLength(6);
  });
});
