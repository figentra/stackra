/**
 * Stackra file contract:
 * Purpose: proves the web Stepper names its step list from `label`, maps the shared `size`, keeps HeroUI Pro's step
 *          props, passes unknown props through, carries HeroUI Pro's own parts and `useStep`, and refuses HeroUI
 *          Pro's `aria-label` and a size outside sm, md and lg.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes and names are
 *          checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-004
import { Stepper as HeroStepper } from "@heroui-pro/react/stepper";
import { render, screen } from "@testing-library/react";

import { Stepper, type StepperProps } from "#react/stepper/stepper";

/** Two steps, the list's props left to the caller. */
function Example(props: Partial<StepperProps>) {
  return (
    <Stepper {...props}>
      <Stepper.Step>
        <Stepper.Indicator />
        <Stepper.Content>
          <Stepper.Title>Account</Stepper.Title>
          <Stepper.Description>Create it</Stepper.Description>
        </Stepper.Content>
        <Stepper.Separator />
      </Stepper.Step>
      <Stepper.Step>
        <Stepper.Indicator />
        <Stepper.Content>
          <Stepper.Title>Billing</Stepper.Title>
        </Stepper.Content>
      </Stepper.Step>
    </Stepper>
  );
}

describe("Stepper (web)", () => {
  it("names the step list from label and passes unknown props through", () => {
    render(<Example label="Checkout" data-testid="list" className="extra" />);
    const list = screen.getByTestId("list");
    expect(list.tagName).toBe("OL");
    expect(list.getAttribute("aria-label")).toBe("Checkout");
    expect(list.classList.contains("extra")).toBe(true);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Account")).toBeTruthy();
  });

  it("keeps HeroUI Pro's own name, Progress, when label is left out", () => {
    render(<Example data-testid="list" />);
    expect(screen.getByTestId("list").getAttribute("aria-label")).toBe("Progress");
  });

  it("keeps HeroUI Pro's step props: currentStep marks the active step", () => {
    render(<Example currentStep={1} />);
    const steps = screen.getAllByRole("listitem");
    expect(steps[0]?.getAttribute("data-status")).toBe("complete");
    expect(steps[1]?.getAttribute("data-status")).toBe("active");
  });

  it("maps the shared size, and keeps HeroUI Pro's default without one", () => {
    const { rerender } = render(<Example data-testid="list" />);
    const plain = screen.getByTestId("list").className;
    rerender(<Example size="lg" data-testid="list" />);
    const large = screen.getByTestId("list").className;
    rerender(
      <HeroStepper.Root size="lg" data-testid="list">
        <HeroStepper.Step>
          <HeroStepper.Indicator />
          <HeroStepper.Content>
            <HeroStepper.Title>Account</HeroStepper.Title>
            <HeroStepper.Description>Create it</HeroStepper.Description>
          </HeroStepper.Content>
          <HeroStepper.Separator />
        </HeroStepper.Step>
        <HeroStepper.Step>
          <HeroStepper.Indicator />
          <HeroStepper.Content>
            <HeroStepper.Title>Billing</HeroStepper.Title>
          </HeroStepper.Content>
        </HeroStepper.Step>
      </HeroStepper.Root>,
    );
    expect(screen.getByTestId("list").className).toBe(large);
    expect(large).not.toBe(plain);
  });

  it("carries HeroUI Pro's own parts and hook", () => {
    for (const part of [
      "Step",
      "Indicator",
      "Content",
      "Title",
      "Description",
      "Icon",
      "Separator",
      "useStep",
    ] as const) {
      expect(Stepper[part]).toBe(HeroStepper[part]);
    }
  });

  it("refuses HeroUI Pro's aria-label and a size outside the shared set", () => {
    expectTypeOf<StepperProps>().toHaveProperty("label");
    // `aria-label` is a hyphenated attribute, which JSX does not type-check: the type itself is asserted.
    expectTypeOf<StepperProps>().not.toHaveProperty("aria-label");
    // @ts-expect-error the shared sizes are sm, md and lg
    void (<Stepper size="xl">{[]}</Stepper>);
  });
});
