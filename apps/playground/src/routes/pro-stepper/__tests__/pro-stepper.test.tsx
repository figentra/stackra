/**
 * Stackra file contract:
 * Purpose: proves the Stepper page sits at /pro-stepper in the Pro category, titles the page and the document, names its
 *          two step lists, draws the four checkout steps, and moves the step, and the line that reports it, from the
 *          Next button.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProStepper } from "#src/routes/pro-stepper/pro-stepper";
import { ProStepperRoute } from "#src/routes/pro-stepper/pro-stepper.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProStepper", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-stepper in the Pro category, and titles the page and the document", () => {
    render(<ProStepper />);
    expect(routePath(ProStepperRoute)).toBe("/pro-stepper");
    expect(ProStepperRoute.category).toBe("Navigation");
    expect(screen.getByRole("heading", { level: 1, name: ProStepperRoute.title })).toBeTruthy();
    expect(document.title).toBe("Stepper · Stackra Playground");
  });

  it("names its two step lists and draws the four checkout steps", () => {
    render(<ProStepper />);
    const checkout = screen.getByRole("list", { name: "Checkout steps" });
    expect(checkout.querySelectorAll("li")).toHaveLength(4);
    expect(screen.getByRole("list", { name: "Order progress" })).toBeTruthy();
  });

  it("moves the step, and reports it, from the Next button", () => {
    render(<ProStepper />);
    expect(screen.getByRole("status").textContent).toBe("Step 2 of 4: Shipping");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("status").textContent).toBe("Step 3 of 4: Payment");
  });
});
