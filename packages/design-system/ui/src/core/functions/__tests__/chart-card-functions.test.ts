/**
 * Stackra file contract:
 * Purpose: proves the chart card helpers: categories sort by value either way or by label in the reader's alphabet,
 *          a chart's rows become raw widget data with previous-period columns, the CSV quotes and defuses its cells,
 *          and "updated ago" picks the largest whole unit in the locale.
 * Boundary: pure functions, no DOM.
 * Runtime: node
 * Governing contract: ADR 0307; ADR 0022 (test placement); STA-1371.
 */
import { chartCsvOf } from "#core/functions/chart-csv-of.function";
import { chartDataOf } from "#core/functions/chart-data-of.function";
import { sortChartItems } from "#core/functions/sort-chart-items.function";
import { updatedAgoOf } from "#core/functions/updated-ago-of.function";

const ITEMS = [
  { label: "Coffee", value: 30 },
  { label: "bakery", value: 50 },
  { label: "Beans", value: 10 },
  { label: "Cards", value: 50 },
];
const value = (item: { value: number }) => item.value;
const label = (item: { label: string }) => item.label;

describe("sortChartItems", () => {
  it("orders by value either way, keeping ties in their given order, and leaves the input alone", () => {
    expect(sortChartItems(ITEMS, "value-desc", value, label, "en").map(label)).toEqual([
      "bakery",
      "Cards",
      "Coffee",
      "Beans",
    ]);
    expect(sortChartItems(ITEMS, "value-asc", value, label, "en").map(label)).toEqual([
      "Beans",
      "Coffee",
      "bakery",
      "Cards",
    ]);
    expect(ITEMS[0]?.label).toBe("Coffee");
    expect(sortChartItems(ITEMS, undefined, value, label, "en")).toEqual(ITEMS);
  });

  it("orders by label in the reader's alphabet, ignoring case", () => {
    expect(sortChartItems(ITEMS, "label", value, label, "en").map(label)).toEqual([
      "bakery",
      "Beans",
      "Cards",
      "Coffee",
    ]);
    const arabic = [{ label: "قهوة" }, { label: "ألبان" }, { label: "خبز" }];
    expect(sortChartItems(arabic, "label", () => 0, label, "ar").map(label)).toEqual([
      "ألبان",
      "خبز",
      "قهوة",
    ]);
  });
});

describe("chartDataOf", () => {
  const series = [
    { key: "sales", label: "Sales", compareKey: "last" },
    { key: "refunds", label: "Refunds" },
  ];
  const data = [
    { month: "Jan", sales: 120, refunds: 4, last: 100 },
    { month: "Feb", sales: null, refunds: 2, last: 90 },
  ];

  it("gives raw cells with gaps as null", () => {
    expect(chartDataOf({ data, series, categoryKey: "month", categoryLabel: "Month" })).toEqual({
      head: ["Month", "Sales", "Refunds"],
      rows: [
        ["Jan", 120, 4],
        ["Feb", null, 2],
      ],
    });
  });

  it("adds a previous-period column per compared series", () => {
    const out = chartDataOf({
      data,
      series,
      categoryKey: "month",
      categoryLabel: "Month",
      compareLabelOf: (item) => `${item.label}, previous period`,
    });
    expect(out.head).toEqual(["Month", "Sales", "Refunds", "Sales, previous period"]);
    expect(out.rows[1]).toEqual(["Feb", null, 2, 90]);
  });
});

describe("chartCsvOf", () => {
  it("writes CRLF lines, quotes commas and quotes, and keeps numbers plain", () => {
    expect(
      chartCsvOf({
        head: ["Item", "Total"],
        rows: [
          ['Tea, "green"', 1200.5],
          ["Gap", null],
          ["Loss", -40],
        ],
      }),
    ).toBe('Item,Total\r\n"Tea, ""green""",1200.5\r\nGap,\r\nLoss,-40\r\n');
  });

  it("defuses a text cell that a spreadsheet would run as a formula", () => {
    expect(chartCsvOf({ head: ["a"], rows: [["=HYPERLINK(1)"], ["@x"], ["-y"]] })).toBe(
      "a\r\n'=HYPERLINK(1)\r\n'@x\r\n'-y\r\n",
    );
  });
});

describe("updatedAgoOf", () => {
  const now = Date.UTC(2026, 9, 29, 12);
  it("writes the largest whole unit in the locale", () => {
    expect(updatedAgoOf(now - 20_000, now, "en")).toBe("now");
    expect(updatedAgoOf(now - 120_000, now, "en")).toBe("2 min. ago");
    expect(updatedAgoOf(new Date(now - 3 * 3_600_000), now, "en")).toBe("3 hr. ago");
    expect(updatedAgoOf(now - 86_400_000, now, "en")).toBe("yesterday");
    expect(updatedAgoOf(now - 120_000, now, "ar")).toBe("قبل دقيقتين");
  });
});
