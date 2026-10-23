/**
 * Stackra file contract:
 * Purpose: proves the DataGrid page sits at /pro-data-grid in the Pro group, titles the page and the document, draws
 *          the invoices in a named grid with sortable columns, sorts the amount as a number, and counts the selected
 *          rows.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has neither.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); ADR 0022 (test placement).
 */
// @covers sta-403:FR-013
import { fireEvent, render, screen, within } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProDataGrid } from "#src/routes/pro-data-grid/pro-data-grid";
import { ProDataGridRoute } from "#src/routes/pro-data-grid/pro-data-grid.route";

/** The customers in the grid, top to bottom. */
const customers = () =>
  within(screen.getByRole("grid", { name: "Invoices" }))
    .getAllByRole("rowheader")
    .map((cell) => cell.textContent);

describe("ProDataGrid", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-data-grid in the Pro group, and titles the page and the document", () => {
    render(<ProDataGrid />);
    expect(ProDataGridRoute.path).toBe("/pro-data-grid");
    expect(ProDataGridRoute.group).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProDataGridRoute.title })).toBeTruthy();
    expect(document.title).toBe("DataGrid · Stackra Playground");
  });

  it("draws the invoices in a named grid, sorted by customer to begin with", () => {
    render(<ProDataGrid />);
    expect(customers()).toEqual([
      "Ada Lovelace",
      "Alan Turing",
      "Barbara Liskov",
      "Edsger Dijkstra",
      "Grace Hopper",
      "Margaret Hamilton",
    ]);
    expect(screen.getByRole("columnheader", { name: /Customer/ }).getAttribute("aria-sort")).toBe(
      "ascending",
    );
  });

  it("sorts the amount as a number when its header is pressed, and reverses on the second press", () => {
    render(<ProDataGrid />);
    const header = screen.getByRole("columnheader", { name: /Amount/ });
    fireEvent.click(header);
    expect(header.getAttribute("aria-sort")).toBe("ascending");
    expect(customers()[0]).toBe("Barbara Liskov"); // 15, which a text sort would place after 1,250
    fireEvent.click(header);
    expect(header.getAttribute("aria-sort")).toBe("descending");
    expect(customers()[0]).toBe("Alan Turing"); // 3,200
  });

  it("counts the selected rows", () => {
    render(<ProDataGrid />);
    expect(screen.getByRole("status").textContent).toBe("0 of 6 selected");
    const row = screen.getByRole("rowheader", { name: "Grace Hopper" }).closest("[role=row]");
    fireEvent.click(within(row as HTMLElement).getByRole("checkbox"));
    expect(screen.getByRole("status").textContent).toBe("1 of 6 selected");
  });
});
