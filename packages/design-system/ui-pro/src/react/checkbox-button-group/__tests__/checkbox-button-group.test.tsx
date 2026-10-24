/**
 * Stackra file contract:
 * Purpose: proves the web CheckboxButtonGroup names the group from `label`, disables its items with `isDisabled`,
 *          leaves HeroUI Pro's defaults when they are left out, passes unknown props through (`defaultValue` checks an
 *          item), carries HeroUI Pro's own parts, and types the accessible name as `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-003
import { CheckboxButtonGroup as HeroCheckboxButtonGroup } from "@heroui-pro/react/checkbox-button-group";
import { render, screen } from "@testing-library/react";

import type { CheckboxButtonGroupContractProps } from "#contracts/types/checkbox-button-group-contract-props.type";
import {
  CheckboxButtonGroup,
  type CheckboxButtonGroupProps,
} from "#react/checkbox-button-group/checkbox-button-group";

function Group(props: Omit<CheckboxButtonGroupProps, "children">) {
  return (
    <CheckboxButtonGroup {...props}>
      {["security", "storage"].map((value) => (
        <CheckboxButtonGroup.Item key={value} value={value}>
          <CheckboxButtonGroup.Indicator />
          <CheckboxButtonGroup.ItemContent>
            <span>{value}</span>
          </CheckboxButtonGroup.ItemContent>
        </CheckboxButtonGroup.Item>
      ))}
    </CheckboxButtonGroup>
  );
}

describe("CheckboxButtonGroup (web)", () => {
  it("names the group from label", () => {
    render(<Group label="Features" />);
    expect(screen.getByRole("group", { name: "Features" })).toBeTruthy();
  });

  it("disables every item with isDisabled, and leaves them enabled when nothing is given", () => {
    const { rerender } = render(<Group isDisabled />);
    for (const box of screen.getAllByRole("checkbox")) {
      expect((box as HTMLInputElement).disabled).toBe(true);
    }
    rerender(<Group />);
    for (const box of screen.getAllByRole("checkbox")) {
      expect((box as HTMLInputElement).disabled).toBe(false);
    }
  });

  it("passes unknown props through to HeroUI Pro", () => {
    render(<Group defaultValue={["storage"]} layout="grid" data-testid="group" />);
    const [security, storage] = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(security?.checked).toBe(false);
    expect(storage?.checked).toBe(true);
    expect(screen.getByTestId("group")).toBeTruthy();
  });

  it("carries HeroUI Pro's own parts", () => {
    expect(CheckboxButtonGroup.Item).toBe(HeroCheckboxButtonGroup.Item);
    expect(CheckboxButtonGroup.Indicator).toBe(HeroCheckboxButtonGroup.Indicator);
    expect(CheckboxButtonGroup.ItemContent).toBe(HeroCheckboxButtonGroup.ItemContent);
    expect(CheckboxButtonGroup.ItemIcon).toBe(HeroCheckboxButtonGroup.ItemIcon);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<CheckboxButtonGroupProps>().toExtend<CheckboxButtonGroupContractProps>();
    expectTypeOf<CheckboxButtonGroupProps>().not.toHaveProperty("aria-label");
  });
});
