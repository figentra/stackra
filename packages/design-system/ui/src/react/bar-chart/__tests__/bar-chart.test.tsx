/**
 * Stackra file contract:
 * Purpose: proves the web charts' frame: a chart carries its numbers as a captioned data table in the locale (Arabic-
 *          Indic digits in Arabic, gaps empty), a legend for two series or more, and none for one unless asked.
 * Boundary: jsdom; Recharts measures nothing there, so the plot itself is proven by the playground e2e suite.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { BarChart } from "#react/bar-chart/bar-chart";
import { DonutChart } from "#react/donut-chart/donut-chart";

const DATA = [
  { month: "Jan", desktop: 1186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: null },
];
const SERIES = [
  { key: "desktop", label: "Desktop" },
  { key: "mobile", label: "Mobile" },
];

describe("BarChart (web)", () => {
  it("gives its numbers as a captioned table and names its series in a legend", () => {
    render(<BarChart data={DATA} series={SERIES} xKey="month" label="Visitors" />);
    const table = screen.getByRole("table", { name: "Visitors" });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Category", "Desktop", "Mobile"]);
    expect(within(table).getAllByRole("row")[1]?.textContent).toBe("Jan1,18680");
    expect(within(table).getAllByRole("row")[2]?.textContent).toBe("Feb305");
    expect(screen.getByRole("list").textContent).toBe("DesktopMobile");
  });

  it("writes Arabic-Indic digits when the locale asks for them and draws no legend for one series", () => {
    render(
      <I18nProvider locale="ar-u-nu-arab">
        <BarChart data={DATA} series={SERIES.slice(0, 1)} xKey="month" label="Visitors" />
      </I18nProvider>,
    );
    expect(screen.getByRole("table").textContent).toContain("١٬١٨٦");
    expect(screen.queryByRole("list")).toBeNull();
  });
});

describe("DonutChart (web)", () => {
  it("names each slice by its series and writes the value header", () => {
    render(
      <DonutChart
        data={[
          { browser: "chrome", visitors: 275 },
          { browser: "safari", visitors: 200 },
        ]}
        series={[
          { key: "chrome", label: "Chrome" },
          { key: "safari", label: "Safari" },
        ]}
        nameKey="browser"
        valueKey="visitors"
        label="Browsers"
        centerLabel="Visitors"
      />,
    );
    const table = screen.getByRole("table", { name: "Browsers" });
    expect(table.textContent).toBe("BrowsersCategoryValueChrome275Safari200");
  });
});
