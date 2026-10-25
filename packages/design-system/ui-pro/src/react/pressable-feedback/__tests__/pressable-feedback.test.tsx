/**
 * Stackra file contract:
 * Purpose: proves the web PressableFeedback renders a button with its feedback layers, honours `isDisabled` and
 *          leaves HeroUI Pro's default when it is left out, passes unknown props through, and carries HeroUI Pro's
 *          own parts.
 * Boundary: jsdom with real HeroUI Pro; the ripple and sweeps animate with layout and timers jsdom does not
 *          drive, so only the structure and the disabled state are checked; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
import { PressableFeedback as HeroPressableFeedback } from "@heroui-pro/react/pressable-feedback";
import { render, screen } from "@testing-library/react";

import {
  PressableFeedback,
  type PressableFeedbackProps,
} from "#react/pressable-feedback/pressable-feedback";

describe("PressableFeedback (web)", () => {
  // First in the file: React warns about a boolean attribute once per run, so a later disabled render hides it.
  it("sets disabled as a boolean, so React warns about no string on it", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<PressableFeedback isDisabled>Save</PressableFeedback>);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    expect(error.mock.calls.flat().join(" ")).not.toMatch(/boolean attribute/);
    error.mockRestore();
  });

  it("renders a button with its feedback layers and passes unknown props through", () => {
    render(
      <PressableFeedback data-testid="press" className="extra" type="button">
        <PressableFeedback.Highlight data-testid="highlight" />
        <PressableFeedback.Ripple />
        Save
      </PressableFeedback>,
    );
    const button = screen.getByRole("button", { name: "Save" });
    expect(screen.getByTestId("press")).toBe(button);
    expect(button.classList.contains("extra")).toBe(true);
    expect(button.contains(screen.getByTestId("highlight"))).toBe(true);
  });

  it("honours isDisabled, and stays enabled without it", () => {
    const { rerender } = render(<PressableFeedback isDisabled>Save</PressableFeedback>);
    const disabled = screen.getByRole("button") as HTMLButtonElement;
    expect(disabled.disabled || disabled.getAttribute("aria-disabled") === "true").toBe(true);
    rerender(<PressableFeedback>Save</PressableFeedback>);
    const enabled = screen.getByRole("button") as HTMLButtonElement;
    expect(enabled.disabled).toBe(false);
    expect(enabled.getAttribute("aria-disabled")).not.toBe("true");
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of ["Highlight", "Ripple", "HoldConfirm", "ProgressFeedback"] as const) {
      expect(PressableFeedback[part]).toBe(HeroPressableFeedback[part]);
    }
  });

  it("takes children and isDisabled, and refuses the native disabled name", () => {
    expectTypeOf<PressableFeedbackProps>().toHaveProperty("children");
    expectTypeOf<PressableFeedbackProps["isDisabled"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<PressableFeedbackProps>().not.toHaveProperty("disabled");
  });
});
