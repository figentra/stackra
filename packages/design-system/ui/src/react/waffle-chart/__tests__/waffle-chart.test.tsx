/**
 * Stackra file contract:
 * Purpose: proves the web WaffleChart hands out every square to the parts in their colours, fills from the reading
 *          start (mirrored in Arabic), lists each part's value and share in the legend and the data table, and draws
 *          the empty track for a zero whole.
 * Boundary: jsdom with real HeroUI and React Aria's I18nProvider.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); WCAG 2.2 SC 1.1.1; STA-1371 (wave D, owner
 *          approval 2026-10-30).
 */
// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { WaffleChart } from "#react/waffle-chart/waffle-chart";

const DATA = [
  { method: "card", orders: 620 },
  { method: "cod", orders: 250 },
  { method: "wallet", orders: 130 },
];
const SERIES = [
  { key: "card", label: "Card" },
  { key: "cod", label: "Cash on delivery" },
  { key: "wallet", label: "Wallet" },
];
const props = {
  data: DATA,
  series: SERIES,
  nameKey: "method",
  valueKey: "orders",
  label: "Payments",
};

const cellsOf = () => [...screen.getByRole("img", { name: "Payments" }).querySelectorAll("rect")];

describe("WaffleChart (web)", () => {
  it("hands out every square by share, in the parts' colours", () => {
    render(<WaffleChart {...props} />);
    const fills = cellsOf().map((cell) => cell.getAttribute("fill"));
    expect(fills).toHaveLength(100);
    expect(fills.filter((fill) => fill === "var(--chart-1)")).toHaveLength(62);
    expect(fills.filter((fill) => fill === "var(--chart-2)")).toHaveLength(25);
    expect(fills.filter((fill) => fill === "var(--chart-3)")).toHaveLength(13);
    expect(cellsOf()[0]?.getAttribute("x")).toBe("0");
  });

  it("lists each part's value and share in the legend and the table", () => {
    render(<WaffleChart {...props} />);
    expect(
      within(screen.getByRole("table"))
        .getAllByRole("row")
        .map((row) => row.textContent),
    ).toEqual(["CategoryValueShare", "Card62062%", "Cash on delivery25025%", "Wallet13013%"]);
    expect(screen.getByRole("list", { hidden: true }).textContent).toBe(
      "Card62062%Cash on delivery25025%Wallet13013%",
    );
  });

  it("fills from the right in Arabic, and draws the track for an empty whole", () => {
    render(
      <I18nProvider locale="ar">
        <WaffleChart {...props} data={[{ method: "card", orders: 0 }]} columns={5} rows={2} />
      </I18nProvider>,
    );
    const cells = cellsOf();
    expect(cells).toHaveLength(10);
    expect(cells[0]?.getAttribute("x")).toBe("48");
    expect(cells.every((cell) => cell.getAttribute("fill") === "var(--muted)")).toBe(true);
  });
});
