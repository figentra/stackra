/**
 * Stackra file contract:
 * Purpose: proves the web CellSlider names the slider thumb from `label`, disables it with `isDisabled`, leaves HeroUI
 *          Pro's defaults when they are left out, passes unknown props through, carries HeroUI Pro's own parts, and
 *          types the accessible name as `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-003
import { CellSlider as HeroCellSlider } from "@heroui-pro/react/cell-slider";
import { render, screen } from "@testing-library/react";

import type { CellSliderContractProps } from "#contracts/types/cell-slider-contract-props.type";
import { CellSlider } from "#react/cell-slider/cell-slider";
import type { CellSliderProps } from "#react/cell-slider/cell-slider.props";

function Cell(props: Omit<CellSliderProps, "children">) {
  return (
    <CellSlider defaultValue={40} {...props}>
      <CellSlider.Track>
        <CellSlider.Fill />
        <CellSlider.Thumb />
        <CellSlider.Label>Spacing</CellSlider.Label>
        <CellSlider.Output />
      </CellSlider.Track>
    </CellSlider>
  );
}

describe("CellSlider (web)", () => {
  it("names the slider from label", () => {
    render(<Cell label="Gap" />);
    expect(screen.getByRole("group", { name: "Gap" })).toBeTruthy();
  });

  it("disables the thumb with isDisabled, and leaves it enabled when nothing is given", () => {
    const { rerender } = render(<Cell isDisabled />);
    expect((screen.getByRole("slider") as HTMLInputElement).disabled).toBe(true);
    rerender(<Cell />);
    expect((screen.getByRole("slider") as HTMLInputElement).disabled).toBe(false);
  });

  it("passes unknown props through to HeroUI Pro", () => {
    render(<Cell minValue={10} maxValue={50} step={5} variant="secondary" data-testid="cell" />);
    const thumb = screen.getByRole("slider") as HTMLInputElement;
    expect(thumb.min).toBe("10");
    expect(thumb.max).toBe("50");
    expect(thumb.step).toBe("5");
    expect(screen.getByTestId("cell")).toBeTruthy();
  });

  it("carries HeroUI Pro's own parts", () => {
    expect(CellSlider.Track).toBe(HeroCellSlider.Track);
    expect(CellSlider.Fill).toBe(HeroCellSlider.Fill);
    expect(CellSlider.Thumb).toBe(HeroCellSlider.Thumb);
    expect(CellSlider.Label).toBe(HeroCellSlider.Label);
    expect(CellSlider.Output).toBe(HeroCellSlider.Output);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<CellSliderProps>().toExtend<CellSliderContractProps>();
    expectTypeOf<CellSliderProps>().not.toHaveProperty("aria-label");
  });
});
