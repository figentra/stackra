/**
 * Stackra file contract:
 * Purpose: proves the NumberStepper page sits at /pro-number-stepper in the Pro group, titles the page and the
 *          document, draws six named steppers with a decrement and an increment button each, and reports the value of the
 *          controlled one.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProNumberStepper } from "#src/routes/pro-number-stepper/pro-number-stepper";
import { ProNumberStepperRoute } from "#src/routes/pro-number-stepper/pro-number-stepper.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProNumberStepper", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-number-stepper in the Pro group, and titles the page and the document", () => {
    render(<ProNumberStepper />);
    expect(routePath(ProNumberStepperRoute)).toBe("/pro-number-stepper");
    expect(ProNumberStepperRoute.category).toBe("Inputs and forms");
    expect(
      screen.getByRole("heading", { level: 1, name: ProNumberStepperRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("NumberStepper · Stackra Playground");
  });

  it("draws six steppers with two buttons each, and disables the last pair", () => {
    render(<ProNumberStepper />);
    const buttons = screen.getAllByRole("button") as HTMLButtonElement[];
    expect(buttons).toHaveLength(12);
    expect(buttons.slice(-2).every((button) => button.disabled)).toBe(true);
  });

  it("reports the value of the controlled stepper", () => {
    render(<ProNumberStepper />);
    expect(screen.getByRole("status").textContent).toBe("Quantity: 5.");
  });
});
