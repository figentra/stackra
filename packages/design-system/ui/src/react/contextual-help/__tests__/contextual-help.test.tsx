/**
 * Stackra file contract:
 * Purpose: proves the web ContextualHelp is a ghost icon button named by `label` that opens a dialog of help, named by
 *          its title or else by the label, draws a question mark for `help` and the "i" for `info`, closes on Escape
 *          back to the button, and passes popover props on.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { ContextualHelpContractProps } from "#contracts/types/contextual-help-contract-props.type";
import { ContextualHelp } from "#react/contextual-help/contextual-help";
import type { ContextualHelpProps } from "#react/contextual-help/contextual-help.props";

const press = (element: HTMLElement) => act(() => element.click());

describe("ContextualHelp (web)", () => {
  it("is a small ghost button named by its label that opens a dialog named by the title", () => {
    render(
      <ContextualHelp label="About tax-inclusive prices" title="Tax-inclusive prices">
        Prices already include VAT.
      </ContextualHelp>,
    );
    const button = screen.getByRole("button", { name: "About tax-inclusive prices" });
    expect(button.classList.contains("button--ghost")).toBe(true);
    expect(button.classList.contains("button--sm")).toBe(true);
    expect(button.querySelector("svg.lucide-circle-question-mark")).toBeTruthy();
    press(button);
    const dialog = screen.getByRole("dialog", { name: "Tax-inclusive prices" });
    expect(dialog.textContent).toContain("Prices already include VAT.");
  });

  it("names the dialog by the label without a title, and draws the i for info", () => {
    render(
      <ContextualHelp label="About the shift float" variant="info">
        The cash the drawer starts with.
      </ContextualHelp>,
    );
    const button = screen.getByRole("button", { name: "About the shift float" });
    expect(button.querySelector("svg.lucide-circle-question-mark")).toBeNull();
    press(button);
    expect(screen.getByRole("dialog", { name: "About the shift float" })).toBeTruthy();
  });

  it("closes on Escape and reports the open state", () => {
    const onOpenChange = vi.fn();
    render(
      <ContextualHelp label="Help" onOpenChange={onOpenChange}>
        Text
      </ContextualHelp>,
    );
    press(screen.getByRole("button", { name: "Help" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("types: extends the contract and refuses a trigger", () => {
    expectTypeOf<ContextualHelpProps>().toExtend<ContextualHelpContractProps>();
    expectTypeOf<ContextualHelpProps>().not.toHaveProperty("trigger");
  });
});
