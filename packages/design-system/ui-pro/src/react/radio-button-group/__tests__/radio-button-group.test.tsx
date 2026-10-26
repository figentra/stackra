/**
 * Stackra file contract:
 * Purpose: proves the web RadioButtonGroup names the group from `label`, disables its items with `isDisabled`, leaves
 *          HeroUI Pro's defaults when they are left out, passes unknown props through (`defaultValue` selects an
 *          item), carries HeroUI Pro's own parts, and types the accessible name as `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-003
import { RadioButtonGroup as HeroRadioButtonGroup } from "@heroui-pro/react/radio-button-group";
import { render, screen } from "@testing-library/react";

import type { RadioButtonGroupContractProps } from "#contracts/types/radio-button-group-contract-props.type";
import { RadioButtonGroup } from "#react/radio-button-group/radio-button-group";
import type { RadioButtonGroupProps } from "#react/radio-button-group/radio-button-group.props";

function Group(props: Omit<RadioButtonGroupProps, "children">) {
  return (
    <RadioButtonGroup {...props}>
      {["standard", "express"].map((value) => (
        <RadioButtonGroup.Item key={value} value={value}>
          <RadioButtonGroup.ItemContent>
            <span>{value}</span>
          </RadioButtonGroup.ItemContent>
          <RadioButtonGroup.Indicator />
        </RadioButtonGroup.Item>
      ))}
    </RadioButtonGroup>
  );
}

describe("RadioButtonGroup (web)", () => {
  it("names the group from label", () => {
    render(<Group label="Delivery" />);
    expect(screen.getByRole("radiogroup", { name: "Delivery" })).toBeTruthy();
  });

  it("disables every item with isDisabled, and leaves them enabled when nothing is given", () => {
    const { rerender } = render(<Group isDisabled />);
    for (const radio of screen.getAllByRole("radio")) {
      expect((radio as HTMLInputElement).disabled).toBe(true);
    }
    rerender(<Group />);
    for (const radio of screen.getAllByRole("radio")) {
      expect((radio as HTMLInputElement).disabled).toBe(false);
    }
  });

  it("passes unknown props through to HeroUI Pro", () => {
    render(<Group defaultValue="express" layout="grid" data-testid="group" />);
    const [standard, express] = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(standard?.checked).toBe(false);
    expect(express?.checked).toBe(true);
    expect(screen.getByTestId("group")).toBeTruthy();
  });

  it("carries HeroUI Pro's own parts", () => {
    expect(RadioButtonGroup.Item).toBe(HeroRadioButtonGroup.Item);
    expect(RadioButtonGroup.Indicator).toBe(HeroRadioButtonGroup.Indicator);
    expect(RadioButtonGroup.ItemContent).toBe(HeroRadioButtonGroup.ItemContent);
    expect(RadioButtonGroup.ItemIcon).toBe(HeroRadioButtonGroup.ItemIcon);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<RadioButtonGroupProps>().toExtend<RadioButtonGroupContractProps>();
    expectTypeOf<RadioButtonGroupProps>().not.toHaveProperty("aria-label");
  });
});
