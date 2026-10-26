/**
 * Stackra file contract:
 * Purpose: proves the web CellColorPicker names its trigger from `label`, disables it with `isDisabled`, leaves HeroUI
 *          Pro's defaults when they are left out, passes unknown props through (`defaultValue` colours the value
 *          text), carries HeroUI Pro's own parts, and types the accessible name as `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-003
import { CellColorPicker as HeroCellColorPicker } from "@heroui-pro/react/cell-color-picker";
import { render, screen } from "@testing-library/react";

import type { CellColorPickerTriggerContractProps } from "#contracts/types/cell-color-picker-contract-props.type";
import { CellColorPicker } from "#react/cell-color-picker/cell-color-picker";
import type { CellColorPickerProps } from "#react/cell-color-picker/cell-color-picker.props";
import type { CellColorPickerTriggerProps } from "#react/cell-color-picker/cell-color-picker-trigger.props";

function Cell(props: Omit<CellColorPickerTriggerProps, "children">) {
  return (
    <CellColorPicker defaultValue="#3B82F6">
      <CellColorPicker.Trigger {...props}>
        <CellColorPicker.Label>Accent</CellColorPicker.Label>
        <CellColorPicker.ValueDisplay data-testid="value" />
        <CellColorPicker.Swatch />
      </CellColorPicker.Trigger>
      <CellColorPicker.Popover>
        <p>Colour controls</p>
      </CellColorPicker.Popover>
    </CellColorPicker>
  );
}

describe("CellColorPicker (web)", () => {
  it("names the trigger from label", () => {
    render(<Cell label="Accent colour" />);
    expect(screen.getByRole("button", { name: "Accent colour" })).toBeTruthy();
  });

  it("disables the trigger with isDisabled, and leaves it enabled when nothing is given", () => {
    const { rerender } = render(<Cell isDisabled />);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    rerender(<Cell />);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false);
  });

  it("passes unknown props through to HeroUI Pro", () => {
    render(<Cell data-testid="trigger" />);
    expect(screen.getByTestId("trigger")).toBeTruthy();
    expect(screen.getByTestId("value").textContent?.toLowerCase()).toContain("3b82f6");
  });

  it("carries HeroUI Pro's own parts", () => {
    expect(CellColorPicker.Label).toBe(HeroCellColorPicker.Label);
    expect(CellColorPicker.ValueDisplay).toBe(HeroCellColorPicker.ValueDisplay);
    expect(CellColorPicker.Swatch).toBe(HeroCellColorPicker.Swatch);
    expect(CellColorPicker.Popover).toBe(HeroCellColorPicker.Popover);
  });

  it("types the accessible name of the trigger as label", () => {
    expectTypeOf<CellColorPickerTriggerProps>().toExtend<CellColorPickerTriggerContractProps>();
    expectTypeOf<CellColorPickerTriggerProps>().not.toHaveProperty("aria-label");
    expectTypeOf<CellColorPickerProps>().toHaveProperty("defaultValue");
  });
});
