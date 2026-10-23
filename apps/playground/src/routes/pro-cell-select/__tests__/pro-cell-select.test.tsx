/**
 * Stackra file contract:
 * Purpose: proves the CellSelect page sits at /pro-cell-select in the Pro group, titles the page and the document,
 *          draws three named select cells, shows the item chosen in the controlled one, and disables the last.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProCellSelect } from "#src/routes/pro-cell-select/pro-cell-select";
import { ProCellSelectRoute } from "#src/routes/pro-cell-select/pro-cell-select.route";

describe("ProCellSelect", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-cell-select in the Pro group, and titles the page and the document", () => {
    render(<ProCellSelect />);
    expect(ProCellSelectRoute.path).toBe("/pro-cell-select");
    expect(ProCellSelectRoute.category).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProCellSelectRoute.title })).toBeTruthy();
    expect(document.title).toBe("CellSelect · Stackra Playground");
  });

  it("draws three select cells, shows the item chosen, and disables the last", () => {
    render(<ProCellSelect />);
    const triggers = screen.getAllByRole("button", { name: /Theme|Language|Region/ });
    expect(triggers).toHaveLength(3);
    expect(screen.getByRole("button", { name: /Theme/ }).textContent).toContain("Default");
    expect(screen.getByRole("button", { name: /Language/ }).textContent).toContain(
      "Choose a language",
    );
    expect((screen.getByRole("button", { name: /Region/ }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(screen.getByRole("status").textContent).toBe("Theme: Default.");
  });
});
