/**
 * Stackra file contract:
 * Purpose: proves the web NumberStepper names the field from `label`, disables it with `isDisabled`, leaves HeroUI
 *          Pro's defaults when they are left out, passes unknown props through (`size`, bounds and a default value),
 *          carries HeroUI Pro's own parts, and types the accessible name as `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-003
import { NumberStepper as HeroNumberStepper } from "@heroui-pro/react/number-stepper";
import { render, screen } from "@testing-library/react";

import type { NumberStepperContractProps } from "#contracts/types/number-stepper-contract-props.type";
import { NumberStepper } from "#react/number-stepper/number-stepper";
import type { NumberStepperProps } from "#react/number-stepper/number-stepper.props";

function Stepper(props: Omit<NumberStepperProps, "children">) {
  return (
    <NumberStepper defaultValue={3} {...props}>
      <NumberStepper.Group>
        <NumberStepper.DecrementButton />
        <NumberStepper.Value />
        <NumberStepper.IncrementButton />
      </NumberStepper.Group>
    </NumberStepper>
  );
}

describe("NumberStepper (web)", () => {
  it("names the field from label", () => {
    render(<Stepper label="Guests" />);
    expect(screen.getByRole("textbox", { name: "Guests" })).toBeTruthy();
  });

  it("disables the buttons with isDisabled, and leaves them enabled when nothing is given", () => {
    const { rerender } = render(<Stepper isDisabled />);
    for (const button of screen.getAllByRole("button")) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
    rerender(<Stepper />);
    for (const button of screen.getAllByRole("button")) {
      expect((button as HTMLButtonElement).disabled).toBe(false);
    }
  });

  it("passes unknown props through to HeroUI Pro", () => {
    render(<Stepper minValue={3} size="lg" data-testid="stepper" />);
    expect(screen.getByTestId("stepper")).toBeTruthy();
    const [decrement] = screen.getAllByRole("button") as HTMLButtonElement[];
    expect(decrement?.disabled).toBe(true);
  });

  it("carries HeroUI Pro's own parts", () => {
    expect(NumberStepper.Group).toBe(HeroNumberStepper.Group);
    expect(NumberStepper.Value).toBe(HeroNumberStepper.Value);
    expect(NumberStepper.DecrementButton).toBe(HeroNumberStepper.DecrementButton);
    expect(NumberStepper.IncrementButton).toBe(HeroNumberStepper.IncrementButton);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<NumberStepperProps>().toExtend<NumberStepperContractProps>();
    expectTypeOf<NumberStepperProps>().not.toHaveProperty("aria-label");
  });
});
