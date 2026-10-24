/**
 * Stackra file contract:
 * Purpose: proves the web CellSwitch names the switch from `label`, disables it with `isDisabled`, leaves HeroUI Pro's
 *          defaults when they are left out, passes unknown props through, carries HeroUI Pro's own parts, and types
 *          the accessible name as `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-003
import { CellSwitch as HeroCellSwitch } from "@heroui-pro/react/cell-switch";
import { render, screen } from "@testing-library/react";

import type { CellSwitchContractProps } from "#contracts/types/cell-switch-contract-props.type";
import { CellSwitch, type CellSwitchProps } from "#react/cell-switch/cell-switch";

function Cell(props: Omit<CellSwitchProps, "children">) {
  return (
    <CellSwitch {...props}>
      <CellSwitch.Trigger>
        <CellSwitch.Label>Animations</CellSwitch.Label>
        <CellSwitch.Control />
      </CellSwitch.Trigger>
    </CellSwitch>
  );
}

describe("CellSwitch (web)", () => {
  it("names the switch from label", () => {
    render(<Cell label="Motion" />);
    expect(screen.getByRole("switch", { name: "Motion" })).toBeTruthy();
  });

  it("disables the switch with isDisabled, and leaves it enabled when nothing is given", () => {
    const { rerender } = render(<Cell isDisabled />);
    expect((screen.getByRole("switch") as HTMLInputElement).disabled).toBe(true);
    rerender(<Cell />);
    expect((screen.getByRole("switch") as HTMLInputElement).disabled).toBe(false);
  });

  it("passes unknown props through to HeroUI Pro", () => {
    const onChange = vi.fn();
    render(<Cell defaultSelected variant="secondary" onChange={onChange} data-testid="cell" />);
    expect((screen.getByRole("switch") as HTMLInputElement).checked).toBe(true);
    expect(screen.getByTestId("cell")).toBeTruthy();
  });

  it("carries HeroUI Pro's own parts", () => {
    expect(CellSwitch.Trigger).toBe(HeroCellSwitch.Trigger);
    expect(CellSwitch.Label).toBe(HeroCellSwitch.Label);
    expect(CellSwitch.Control).toBe(HeroCellSwitch.Control);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<CellSwitchProps>().toExtend<CellSwitchContractProps>();
    expectTypeOf<CellSwitchProps>().not.toHaveProperty("aria-label");
  });
});
