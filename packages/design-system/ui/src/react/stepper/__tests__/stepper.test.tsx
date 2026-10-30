/**
 * Stackra file contract:
 * Purpose: proves the web Stepper marks the current step `aria-current="step"`, says which steps are complete or
 *          failing, presses only complete steps when linear, and writes "Step 2 of 3" in the compact variant.
 * Boundary: jsdom; English words from the catalogue.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Stepper } from "#react/stepper/stepper";

const STEPS = [
  { id: "basics", label: "Basics" },
  { id: "pricing", label: "Pricing" },
  { id: "review", label: "Review" },
] as const;

describe("Stepper (web)", () => {
  it("marks the current step and presses only complete ones when linear", () => {
    const pressed: string[] = [];
    render(
      <Stepper
        steps={STEPS}
        currentStep="pricing"
        label="Add a product"
        onStepPress={(id) => pressed.push(id)}
      />,
    );
    const list = screen.getByRole("list", { name: "Add a product" });
    expect(list.querySelector("[aria-current=step]")?.textContent).toContain("Pricing");
    const [button, ...others] = screen.getAllByRole("button");
    expect(others).toHaveLength(0);
    expect(button?.textContent).toContain("Basics, Completed");
    if (button) fireEvent.click(button);
    expect(pressed).toEqual(["basics"]);
  });

  it("presses any other step when not linear and says a failing step needs attention", () => {
    render(
      <Stepper
        steps={[...STEPS.slice(0, 2), { id: "review", label: "Review", status: "error" }]}
        currentStep="basics"
        isLinear={false}
        onStepPress={() => undefined}
      />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.getByText(/Needs attention/u)).toBeTruthy();
  });

  it("writes the position in the compact variant", () => {
    render(<Stepper steps={STEPS} currentStep="pricing" variant="compact" />);
    expect(screen.getByRole("group", { name: "Progress" }).textContent).toContain("Step 2 of 3");
  });
});
