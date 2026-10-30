/**
 * Stackra file contract:
 * Purpose: proves the web CandlestickChart's data table follows the volume: a Volume column only when some period has
 *          one (or `showVolume` asks), left empty for a period without it, and dropped when `showVolume` is false;
 *          dates and prices use the given formats.
 * Boundary: jsdom; Recharts measures nothing there, so the candles themselves are proven by the playground
 *           screenshots, and this proves the table every reader (and a screen reader) gets.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.1.1; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";

import { CandlestickChart } from "#react/candlestick-chart/candlestick-chart";

const rowsOf = () =>
  within(screen.getByRole("table"))
    .getAllByRole("row")
    .map((row) => row.textContent);

const ROWS = [
  { date: "D1", open: 10, high: 12, low: 9, close: 11, volume: 1500 },
  { date: "D2", open: 11, high: 11.5, low: 8, close: 8.5 },
];

describe("CandlestickChart table (web)", () => {
  it("has no Volume column when no period has a volume", () => {
    render(
      <CandlestickChart
        data={ROWS.map(({ volume: _volume, ...row }) => row)}
        label="Price"
        valueFormat={{ minimumFractionDigits: 2 }}
      />,
    );
    expect(rowsOf()).toEqual([
      "CategoryOpenHighLowClose",
      "D110.0012.009.0011.00",
      "D211.0011.508.008.50",
    ]);
  });

  it("leaves a period without a volume empty, and drops the column when told", () => {
    const { unmount } = render(<CandlestickChart data={ROWS} label="Price" />);
    expect(rowsOf()).toEqual(["CategoryOpenHighLowCloseVolume", "D110129111.5K", "D21111.588.5"]);
    unmount();
    render(<CandlestickChart data={ROWS} label="Price" showVolume={false} />);
    expect(rowsOf()[0]).toBe("CategoryOpenHighLowClose");
  });
});
