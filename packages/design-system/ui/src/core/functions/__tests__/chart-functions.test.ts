/**
 * Stackra file contract:
 * Purpose: proves the chart helpers shared by web and native: series colours fall back to the set by position, values
 *          and categories are written in the locale with Arabic-Indic digits in Arabic, dates stay on their UTC day,
 *          and the data table and spoken text carry every value with gaps left empty.
 * Boundary: pure functions, no DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { chartTableOf } from "#core/functions/chart-table-of.function";
import { chartTextOf } from "#core/functions/chart-text-of.function";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";

const WORDS = { category: "Category", value: "Value" };
const SERIES = [
  { key: "desktop", label: "Desktop" },
  { key: "mobile", label: "Mobile", color: "success" as const },
];

describe("chartColorOf", () => {
  it("keeps a series' own colour, picks the accent steps by default and wraps after five", () => {
    expect(chartColorOf(SERIES[1], 1)).toBe("success");
    expect(chartColorOf(SERIES[0], 0)).toBe("chart-ramp-1");
    expect(chartColorOf(undefined, 4)).toBe("chart-ramp-5");
    expect(chartColorOf(undefined, 5)).toBe("chart-ramp-1");
    expect(chartColorOf(undefined, 1, "categorical")).toBe("chart-2");
  });
});

describe("formatChartNumber", () => {
  it("writes the locale's format", () => {
    expect(formatChartNumber(1234.5, "en")).toBe("1,234.5");
    expect(formatChartNumber(1500, "en", { notation: "compact" })).toBe("1.5K");
    expect(formatChartNumber(42, "en", { style: "currency", currency: "USD" })).toBe("$42.00");
  });

  it("writes the digits the locale tag's nu keyword names (the customer's setting), in either language", () => {
    expect(formatChartNumber(1234.5, "ar-u-nu-arab")).toBe("١٬٢٣٤٫٥");
    expect(formatChartNumber(7, "ar-EG-u-nu-arab")).toBe("٧");
    expect(formatChartNumber(1234.5, "en-u-nu-arab")).toBe("١٬٢٣٤٫٥");
    expect(formatChartNumber(1234.5, "ar-u-nu-latn")).toBe("1,234.5");
  });
});

describe("formatChartCategory", () => {
  it("writes an ISO day on its own day in UTC, in the locale", () => {
    expect(formatChartCategory("2026-04-01", "en", { month: "short", day: "numeric" })).toBe(
      "Apr 1",
    );
    expect(formatChartCategory("2026-04-01", "ar-u-nu-arab", { day: "numeric" })).toBe("١");
    expect(formatChartCategory("2026-04-01", "ar-u-nu-latn", { day: "numeric" })).toBe("1");
  });

  it("shows words as given, numbers in the locale, and nothing for a missing category", () => {
    expect(formatChartCategory("January", "ar", { month: "short" })).toBe("January");
    expect(formatChartCategory(12, "ar-u-nu-arab")).toBe("١٢");
    expect(formatChartCategory(null, "en")).toBe("");
  });
});

describe("chartTableOf", () => {
  it("gives a cartesian chart one column per series and leaves gaps empty", () => {
    const table = chartTableOf({
      data: [
        { month: "Jan", desktop: 186, mobile: 80 },
        { month: "Feb", desktop: 305, mobile: null },
      ],
      series: SERIES,
      categoryKey: "month",
      locale: "en",
      words: WORDS,
    });
    expect(table).toEqual({
      head: ["Category", "Desktop", "Mobile"],
      rows: [
        ["Jan", "186", "80"],
        ["Feb", "305", ""],
      ],
    });
  });

  it("gives a pie one row per slice, named by its series", () => {
    const table = chartTableOf({
      data: [
        { browser: "chrome", visitors: 1275 },
        { browser: "other", visitors: 90 },
      ],
      series: [{ key: "chrome", label: "Chrome" }],
      categoryKey: "browser",
      valueKey: "visitors",
      locale: "ar-u-nu-arab",
      words: WORDS,
    });
    expect(table).toEqual({
      head: ["Category", "Value"],
      rows: [
        ["Chrome", "١٬٢٧٥"],
        ["other", "٩٠"],
      ],
    });
  });
});

describe("chartTextOf", () => {
  it("reads each row with its series' labels", () => {
    const table = { head: ["Category", "Desktop", "Mobile"], rows: [["Jan", "186", "80"]] };
    expect(chartTextOf(table, "en")).toBe("Jan: Desktop 186, Mobile 80");
    expect(chartTextOf(table, "ar")).toBe("Jan: Desktop 186، Mobile 80");
  });

  it("reads a single value column without its header", () => {
    expect(
      chartTextOf(
        {
          head: ["Category", "Value"],
          rows: [
            ["A", "1"],
            ["B", "2"],
          ],
        },
        "en",
      ),
    ).toBe("A: 1; B: 2");
  });
});

describe("numerals from the locale tag", () => {
  it("follows the provider's -u-nu- extension before the language", () => {
    expect(formatChartNumber(1234, "ar-u-nu-latn")).toBe("1,234");
    expect(formatChartNumber(12, "en-u-nu-arab")).toBe("١٢");
    expect(formatChartCategory("2026-04-01", "ar-u-nu-latn", { day: "numeric" })).toBe("1");
  });
});
