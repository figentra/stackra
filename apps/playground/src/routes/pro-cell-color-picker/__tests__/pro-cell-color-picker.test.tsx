/**
 * Stackra file contract:
 * Purpose: proves the CellColorPicker page sits at /pro-cell-color-picker in the Pro group, titles the page and the
 *          document, draws three triggers named by their labels with the colour as text, reports the controlled colour as
 *          hex, and disables the last.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProCellColorPicker } from "#src/routes/pro-cell-color-picker/pro-cell-color-picker";
import { ProCellColorPickerRoute } from "#src/routes/pro-cell-color-picker/pro-cell-color-picker.route";

describe("ProCellColorPicker", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-cell-color-picker in the Pro group, and titles the page and the document", () => {
    render(<ProCellColorPicker />);
    expect(ProCellColorPickerRoute.path).toBe("/pro-cell-color-picker");
    expect(ProCellColorPickerRoute.category).toBe("Inputs and forms");
    expect(
      screen.getByRole("heading", { level: 1, name: ProCellColorPickerRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("CellColorPicker · Stackra Playground");
  });

  it("draws three named triggers, and disables the last", () => {
    render(<ProCellColorPicker />);
    expect(screen.getByRole("button", { name: "Accent" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Highlight" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Border" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("reports the controlled colour as hex", () => {
    render(<ProCellColorPicker />);
    expect(screen.getByRole("status").textContent).toBe("Accent: #3B82F6.");
  });
});
