/**
 * Stackra file contract:
 * Purpose: proves the web ColorField: a textbox named by its label (or an English default) with its description and
 *          error tied to it; a typed hex is committed on blur and reported in lowercase hex, a cleared field as an empty
 *          string; a controlled value is followed; the current colour's swatch shows before the input and is hidden from
 *          assistive technology; the disabled, read-only and required states reach the input; and in right-to-left the
 *          hex input stays left to right.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles and attributes are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1981.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { ColorField } from "#react/color-field/color-field";

const input = (name: string | RegExp) => screen.getByRole("textbox", { name }) as HTMLInputElement;

/** Types into the field and leaves it, which is when React Aria commits the text. */
const commit = (field: HTMLInputElement, text: string) => {
  act(() => field.focus());
  fireEvent.change(field, { target: { value: text } });
  act(() => field.blur());
};

describe("ColorField (web)", () => {
  it("is a textbox named by its label, with its description and error", () => {
    render(
      <ColorField
        label="Brand colour"
        description="Used on buttons"
        errorMessage="Not a colour"
        isInvalid
        defaultValue="#0485f7"
      />,
    );
    const field = input("Brand colour");
    expect(field.value.toLowerCase()).toBe("#0485f7");
    expect(field.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("Used on buttons")).toBeTruthy();
    expect(screen.getByText("Not a colour")).toBeTruthy();
  });

  it("reports a typed hex in lowercase on blur, and a cleared field as empty", () => {
    const onChange = vi.fn();
    render(<ColorField label="Colour" onChange={onChange} />);
    commit(input("Colour"), "#FF0000");
    expect(onChange).toHaveBeenLastCalledWith("#ff0000");
    commit(input("Colour"), "");
    expect(onChange).toHaveBeenLastCalledWith("");
  });

  it("follows a controlled value and shows its swatch, hidden from assistive technology", () => {
    const { container, rerender } = render(<ColorField label="Colour" value="#00ff00" />);
    expect(input("Colour").value.toLowerCase()).toBe("#00ff00");
    expect(container.querySelector("[aria-hidden='true'] .color-swatch")).toBeTruthy();
    rerender(<ColorField label="Colour" value="#0000ff" />);
    expect(input("Colour").value.toLowerCase()).toBe("#0000ff");
    rerender(<ColorField label="Colour" value="" />);
    expect(input("Colour").value).toBe("");
    expect(container.querySelector(".color-swatch")).toBeNull();
  });

  it("is named by the package's word without a label and takes the field states", () => {
    const { rerender } = render(<ColorField isDisabled />);
    expect(input("Colour").disabled).toBe(true);
    rerender(<ColorField isReadOnly isRequired />);
    expect(input("Colour").readOnly).toBe(true);
    expect(input("Colour").required || input("Colour").getAttribute("aria-required")).toBeTruthy();
  });

  it("keeps the hex input left to right in a right-to-left page", () => {
    render(
      <div dir="rtl">
        <ColorField label="اللون" defaultValue="#123456" />
      </div>,
    );
    expect(input("اللون").getAttribute("dir")).toBe("ltr");
  });
});
