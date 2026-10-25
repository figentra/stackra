/**
 * Stackra file contract:
 * Purpose: proves the web `CheckboxField` names its checkbox by its children, reports the new state, shows the error
 *          of a binding while invalid, and submits under its name when checked.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: ADR 0055; ADR 0165 (decision 2); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { CheckboxField } from "#react/checkbox-field/checkbox-field";

describe("CheckboxField (web)", () => {
  it("is named by its children and reports the new state", () => {
    const onChange = vi.fn();
    render(<CheckboxField onChange={onChange}>I agree to the privacy policy</CheckboxField>);
    fireEvent.click(screen.getByRole("checkbox", { name: "I agree to the privacy policy" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("shows the binding's error while invalid", () => {
    render(
      <CheckboxField name="consent" isInvalid errorMessage="consent_required">
        I agree
      </CheckboxField>,
    );
    expect(screen.getByText("consent_required")).toBeTruthy();
  });

  it("submits under its name when checked", () => {
    const { container } = render(
      <form>
        <CheckboxField name="consent" value>
          I agree
        </CheckboxField>
      </form>,
    );
    const data = new FormData(container.querySelector("form") as HTMLFormElement);
    expect(data.has("consent")).toBe(true);
  });
});
