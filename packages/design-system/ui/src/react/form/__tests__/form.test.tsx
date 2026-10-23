/**
 * Stackra file contract:
 * Purpose: proves the web Form is a `form` element that hands `validationErrors` to the HeroUI fields inside it,
 *          submits on Cmd or Ctrl plus Enter when `isSubmitOnModEnter` is set, stops Enter alone submitting from a text
 *          box but leaves Enter to buttons, checkboxes and text areas, leaves Enter during text composition alone, does
 *          nothing extra when the prop is off, and still calls the caller's own key handler.
 * Boundary: jsdom with real HeroUI and React Aria; jsdom's `requestSubmit` fires the `submit` event the way a browser does.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (forms); ADR 0022 (test placement); WCAG 2.2 SC 2.1.1.
 */
// @vitest-environment jsdom
// @covers sta-350:FR-093
import { Input, TextField as HeroTextField } from "@heroui/react";
import { fireEvent, render, screen } from "@testing-library/react";

import type { FormContractProps } from "#contracts/types/form-contract-props.type";
import { FieldError } from "#react/field-error/field-error";
import { Form, type FormProps } from "#react/form/form";

/** A form with one of each control Enter treats differently, and a spy on its submit. */
function renderForm(props: Partial<FormProps> = {}) {
  const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
  render(
    <Form aria-label="Profile" onSubmit={onSubmit} {...props}>
      <input aria-label="Name" />
      <textarea aria-label="Bio" />
      <input type="checkbox" aria-label="Subscribe" />
      <button type="button">Plain</button>
    </Form>,
  );
  return onSubmit;
}

/** Presses a key on an element and says whether the default action was left alone. */
const press = (element: HTMLElement, init: KeyboardEventInit) =>
  fireEvent.keyDown(element, { key: "Enter", ...init });

describe("Form (web)", () => {
  it("is a form element with its name", () => {
    renderForm();
    expect(screen.getByRole("form", { name: "Profile" }).tagName).toBe("FORM");
  });

  it("hands validationErrors to the HeroUI fields inside it", () => {
    render(
      <Form aria-label="Account" validationErrors={{ email: "Already registered." }}>
        <HeroTextField name="email">
          <Input aria-label="Email" />
          <FieldError />
        </HeroTextField>
      </Form>,
    );
    expect(screen.getByText("Already registered.")).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Email" }).getAttribute("aria-invalid")).toBe(
      "true",
    );
  });

  it("submits on Cmd plus Enter and on Ctrl plus Enter when asked", () => {
    const onSubmit = renderForm({ isSubmitOnModEnter: true });
    press(screen.getByRole("textbox", { name: "Name" }), { metaKey: true });
    press(screen.getByRole("textbox", { name: "Bio" }), { ctrlKey: true });
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it("stops Enter alone submitting from a text box", () => {
    const onSubmit = renderForm({ isSubmitOnModEnter: true });
    const allowed = press(screen.getByRole("textbox", { name: "Name" }), {});
    expect(allowed).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("leaves Enter to a text area, a checkbox and a button", () => {
    renderForm({ isSubmitOnModEnter: true });
    for (const control of [
      screen.getByRole("textbox", { name: "Bio" }),
      screen.getByRole("checkbox", { name: "Subscribe" }),
      screen.getByRole("button", { name: "Plain" }),
    ])
      expect(press(control, {})).toBe(true);
  });

  it("leaves Enter alone while text is being composed", () => {
    const onSubmit = renderForm({ isSubmitOnModEnter: true });
    const name = screen.getByRole("textbox", { name: "Name" });
    expect(press(name, { isComposing: true, metaKey: true })).toBe(true);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does nothing extra without isSubmitOnModEnter", () => {
    const onSubmit = renderForm();
    const name = screen.getByRole("textbox", { name: "Name" });
    expect(press(name, {})).toBe(true);
    expect(press(name, { metaKey: true })).toBe(true);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("ignores other keys and still calls the caller's own key handler", () => {
    const onKeyDown = vi.fn();
    const onSubmit = renderForm({ isSubmitOnModEnter: true, onKeyDown });
    const name = screen.getByRole("textbox", { name: "Name" });
    expect(fireEvent.keyDown(name, { key: "a", metaKey: true })).toBe(true);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("types: extends the contract and takes isSubmitOnModEnter", () => {
    expectTypeOf<FormProps>().toExtend<FormContractProps>();
    expectTypeOf<FormProps["isSubmitOnModEnter"]>().toEqualTypeOf<boolean | undefined>();
  });
});
