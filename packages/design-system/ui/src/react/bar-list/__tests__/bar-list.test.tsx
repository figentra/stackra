/**
 * Stackra file contract:
 * Purpose: proves the web BarList is a named list ranked by value, each row's text its label and formatted value, the
 *          bar hidden and sized with a logical width, and a row with `href` linking its label.
 * Boundary: jsdom.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { BarList } from "#react/bar-list/bar-list";

describe("BarList (web)", () => {
  it("ranks the rows, writes the values and sizes the bars", () => {
    const { container } = render(
      <BarList
        label="Sales by city"
        valueFormat={{ maximumFractionDigits: 0 }}
        items={[
          { key: "jed", label: "Jeddah", value: 4200 },
          { key: "ruh", label: "Riyadh", value: 8400, href: "/cities/riyadh" },
        ]}
      />,
    );
    const rows = screen.getAllByRole("listitem");
    expect(screen.getByRole("list", { name: "Sales by city" })).toBeTruthy();
    expect(rows.map((row) => row.textContent)).toEqual(["Riyadh8,400", "Jeddah4,200"]);
    expect(screen.getByRole("link", { name: "Riyadh" }).getAttribute("href")).toBe(
      "/cities/riyadh",
    );
    const bars = container.querySelectorAll<HTMLElement>("li > div > span[aria-hidden]");
    expect([...bars].map((bar) => bar.style.width)).toEqual(["100%", "50%"]);
  });
});
