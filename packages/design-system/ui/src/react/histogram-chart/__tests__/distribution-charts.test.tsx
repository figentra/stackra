/**
 * Stackra file contract:
 * Purpose: proves the web distribution charts carry their numbers as a captioned data table in the locale: the
 *          histogram's bins and counts, the box plot's five-number summary and outliers, the range bar's low and high,
 *          and the bullet chart's value and target, with Arabic-Indic digits when the locale asks for them.
 * Boundary: jsdom; Recharts measures nothing there, so the drawn plot is proven by the playground screenshots.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); WCAG 2.2 SC 1.1.1; STA-1371.
 */
// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { BoxPlotChart } from "#react/box-plot-chart/box-plot-chart";
import { BulletChart } from "#react/bullet-chart/bullet-chart";
import { HistogramChart } from "#react/histogram-chart/histogram-chart";
import { RangeBarChart } from "#react/range-bar-chart/range-bar-chart";

/** The text of each body row of the one table. */
const rows = () =>
  within(screen.getByRole("table"))
    .getAllByRole("row")
    .slice(1)
    .map((row) => [...row.children].map((cell) => cell.textContent));

describe("HistogramChart (web)", () => {
  it("writes each bin's edges and count", () => {
    render(<HistogramChart values={[1, 2, 2, 9]} binCount={2} label="Order totals" />);
    expect(screen.getByRole("table", { name: "Order totals" })).toBeTruthy();
    expect(rows()).toEqual([
      ["1–5", "3"],
      ["5–9", "1"],
    ]);
  });
});

describe("BoxPlotChart (web)", () => {
  it("writes each group's summary and outliers", () => {
    render(
      <BoxPlotChart
        groups={[
          { key: "a", label: "Riyadh", values: [1, 2, 3, 4, 100] },
          { key: "b", label: "Empty", values: [] },
        ]}
        label="Delivery minutes"
      />,
    );
    expect(
      within(screen.getByRole("table"))
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual([
      "Category",
      "Minimum",
      "Lower quartile",
      "Median",
      "Upper quartile",
      "Maximum",
      "Outliers",
    ]);
    expect(rows()).toEqual([["Riyadh", "1", "2", "3", "4", "100", "100"]]);
  });
});

describe("RangeBarChart (web)", () => {
  it("writes each row's low and high, a gap left empty", () => {
    render(
      <RangeBarChart
        data={[
          { day: "Sun", low: 21, high: 34 },
          { day: "Mon", low: null, high: 33 },
        ]}
        xKey="day"
        fromKey="low"
        toKey="high"
        label="Temperature"
      />,
    );
    expect(rows()).toEqual([
      ["Sun", "21", "34"],
      ["Mon", "", "33"],
    ]);
  });
});

describe("BulletChart (web)", () => {
  it("writes each measure's value and target in the locale", () => {
    render(
      <I18nProvider locale="ar-u-nu-arab">
        <BulletChart
          items={[
            {
              key: "revenue",
              label: "الإيراد",
              value: 1200,
              target: 1500,
              ranges: [600, 1000, 2000],
            },
            { key: "orders", label: "الطلبات", value: 80 },
          ]}
          label="أهداف الربع"
        />
      </I18nProvider>,
    );
    expect(rows()).toEqual([
      ["الإيراد", "١٬٢٠٠", "١٬٥٠٠"],
      ["الطلبات", "٨٠", ""],
    ]);
    expect(screen.getByRole("img", { name: "أهداف الربع" })).toBeTruthy();
  });
});
