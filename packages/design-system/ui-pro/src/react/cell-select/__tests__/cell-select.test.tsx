/**
 * Stackra file contract:
 * Purpose: proves the web CellSelect names the select from `label`, disables it with `isDisabled`, leaves HeroUI Pro's
 *          defaults when they are left out, passes unknown props through (`defaultValue` selects an item), carries
 *          HeroUI Pro's own parts, and types the accessible name as `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-003
import { ListBox } from "@heroui/react";
import { CellSelect as HeroCellSelect } from "@heroui-pro/react/cell-select";
import { render, screen } from "@testing-library/react";

import type { CellSelectContractProps } from "#contracts/types/cell-select-contract-props.type";
import { CellSelect, type CellSelectProps } from "#react/cell-select/cell-select";

function Cell(props: Omit<CellSelectProps, "children">) {
  return (
    <CellSelect {...props}>
      <CellSelect.Trigger>
        <CellSelect.Label>Theme</CellSelect.Label>
        <CellSelect.Value />
        <CellSelect.Indicator />
      </CellSelect.Trigger>
      <CellSelect.Popover>
        <ListBox>
          <ListBox.Item id="default" textValue="Default">
            Default
          </ListBox.Item>
          <ListBox.Item id="dark" textValue="Dark">
            Dark
          </ListBox.Item>
        </ListBox>
      </CellSelect.Popover>
    </CellSelect>
  );
}

describe("CellSelect (web)", () => {
  it("names the select from label", () => {
    render(<Cell label="Appearance" />);
    expect(screen.getByRole("button", { name: /Appearance/ })).toBeTruthy();
  });

  it("disables the trigger with isDisabled, and leaves it enabled when nothing is given", () => {
    const { rerender } = render(<Cell isDisabled />);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    rerender(<Cell />);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false);
  });

  it("passes unknown props through to HeroUI Pro", () => {
    render(<Cell defaultValue="dark" variant="secondary" data-testid="cell" />);
    expect(screen.getByTestId("cell")).toBeTruthy();
    expect(screen.getByRole("button").textContent).toContain("Dark");
  });

  it("carries HeroUI Pro's own parts", () => {
    expect(CellSelect.Trigger).toBe(HeroCellSelect.Trigger);
    expect(CellSelect.Label).toBe(HeroCellSelect.Label);
    expect(CellSelect.Value).toBe(HeroCellSelect.Value);
    expect(CellSelect.Indicator).toBe(HeroCellSelect.Indicator);
    expect(CellSelect.Popover).toBe(HeroCellSelect.Popover);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<CellSelectProps>().toExtend<CellSelectContractProps>();
    expectTypeOf<CellSelectProps>().not.toHaveProperty("aria-label");
  });
});
