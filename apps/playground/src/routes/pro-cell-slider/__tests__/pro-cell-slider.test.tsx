/**
 * Stackra file contract:
 * Purpose: proves the CellSlider page sits at /pro-cell-slider in the Pro group, titles the page and the document,
 *          draws three named sliders with their values, reports the value of the controlled one, and disables the last.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProCellSlider } from "#src/routes/pro-cell-slider/pro-cell-slider";
import { ProCellSliderRoute } from "#src/routes/pro-cell-slider/pro-cell-slider.route";

describe("ProCellSlider", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-cell-slider in the Pro group, and titles the page and the document", () => {
    render(<ProCellSlider />);
    expect(ProCellSliderRoute.path).toBe("/pro-cell-slider");
    expect(ProCellSliderRoute.category).toBe("Inputs and forms");
    expect(screen.getByRole("heading", { level: 1, name: ProCellSliderRoute.title })).toBeTruthy();
    expect(document.title).toBe("CellSlider · Stackra Playground");
  });

  it("draws three named sliders with their values, and disables the last", () => {
    render(<ProCellSlider />);
    expect(screen.getAllByRole("slider")).toHaveLength(3);
    expect((screen.getByRole("slider", { name: "Volume" }) as HTMLInputElement).value).toBe("0.75");
    expect((screen.getByRole("slider", { name: "Brightness" }) as HTMLInputElement).disabled).toBe(
      true,
    );
  });

  it("reports the value of the controlled slider", () => {
    render(<ProCellSlider />);
    expect(screen.getByRole("status").textContent).toBe("Spacing is 0.50.");
    const slider = screen.getByRole("slider", { name: "Spacing" });
    fireEvent.change(slider, { target: { value: "0.8" } });
    expect(screen.getByRole("status").textContent).toBe("Spacing is 0.80.");
  });
});
