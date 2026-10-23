/**
 * Stackra file contract:
 * Purpose: proves the web TextField ties its label, description and error to the input, shows the error only while the
 *          field is invalid, keeps the required, disabled and read-only states, edits a controlled and an uncontrolled
 *          value and reports each change as a string, submits under its name, takes the variant and the full-width
 *          default, passes unknown props through, and refuses `fullWidth`, `children` and a missing name type.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes and attributes are checked,
 *           not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-063 sta-350:FR-064
import { fireEvent, render, screen } from "@testing-library/react";
import { createElement, useState } from "react";

import { TextFieldType } from "#contracts/enums/text-field-type.enum";
import { TextFieldVariant } from "#contracts/enums/text-field-variant.enum";
import type { TextFieldContractProps } from "#contracts/types/text-field-contract-props.type";
import { TextField, type TextFieldProps } from "#react/text-field/text-field";

/** A field whose value the test keeps in state, so the field is controlled. */
function Controlled() {
  const [value, setValue] = useState("one");
  return <TextField label="Name" value={value} onChange={setValue} />;
}

describe("TextField (web)", () => {
  it("names the input by its label and ties the description to it", () => {
    render(<TextField label="Email" description="We never share it" />);
    const input = screen.getByRole("textbox", { name: "Email" });
    const hint = screen.getByText("We never share it");
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(hint.id);
  });

  it("draws only the parts it is given", () => {
    const { container } = render(<TextField aria-label="Bare" />);
    expect(screen.getByRole("textbox", { name: "Bare" })).toBeTruthy();
    expect(container.querySelector("label")).toBeNull();
    expect(container.querySelector('[data-slot="description"]')).toBeNull();
    expect(container.querySelector('[data-slot="error-message"]')).toBeNull();
  });

  it("shows the error message only while the field is invalid, and reads it with the field", () => {
    const { rerender } = render(<TextField label="Email" errorMessage="Enter a valid email" />);
    expect(screen.queryByText("Enter a valid email")).toBeNull();
    rerender(<TextField label="Email" errorMessage="Enter a valid email" isInvalid />);
    const input = screen.getByRole("textbox", { name: "Email" });
    const message = screen.getByText("Enter a valid email");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(message.id);
  });

  it("marks the field required, disabled and read-only", () => {
    const { rerender } = render(<TextField label="Name" isRequired />);
    expect(screen.getByRole("textbox", { name: /Name/ }).hasAttribute("required")).toBe(true);
    rerender(<TextField label="Name" isDisabled />);
    expect(screen.getByRole("textbox", { name: "Name" }).hasAttribute("disabled")).toBe(true);
    rerender(<TextField label="Name" isReadOnly value="fixed" />);
    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input.hasAttribute("readonly")).toBe(true);
    expect(input.hasAttribute("disabled")).toBe(false);
  });

  it("keeps its own text when uncontrolled and reports each change as a string", () => {
    const onChange = vi.fn();
    render(<TextField label="Name" defaultValue="Ada" onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement;
    expect(input.value).toBe("Ada");
    fireEvent.change(input, { target: { value: "Ada L" } });
    expect(onChange).toHaveBeenCalledWith("Ada L");
    expect(input.value).toBe("Ada L");
  });

  it("shows the value it is given when controlled", () => {
    render(<Controlled />);
    const input = screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "two" } });
    expect(input.value).toBe("two");
  });

  it("submits under its name and shows the placeholder", () => {
    const { container } = render(
      <form>
        <TextField label="Name" name="fullName" defaultValue="Ada" placeholder="Your name" />
      </form>,
    );
    const input = screen.getByPlaceholderText("Your name") as HTMLInputElement;
    expect(input.name).toBe("fullName");
    expect(new FormData(container.querySelector("form") as HTMLFormElement).get("fullName")).toBe(
      "Ada",
    );
  });

  it("is a primary, full-width field by default and takes the secondary variant", () => {
    const { container, rerender } = render(<TextField label="Name" />);
    const root = () => container.querySelector('[data-slot="textfield"]');
    expect(root()?.classList.contains("textfield--full-width")).toBe(true);
    expect(container.querySelector('[data-slot="input"]')?.className).toContain("input--primary");
    rerender(<TextField label="Name" isFullWidth={false} variant="secondary" />);
    expect(root()?.classList.contains("textfield--full-width")).toBe(false);
    expect(container.querySelector('[data-slot="input"]')?.className).toContain("input--secondary");
  });

  it.each(TextFieldType)("gives the input type %s", (type) => {
    const { container } = render(<TextField aria-label="Kind" type={type} />);
    expect(container.querySelector("input")?.getAttribute("type")).toBe(type);
  });

  it.each(TextFieldVariant)("accepts the %s variant", (variant) => {
    const { container } = render(<TextField aria-label="Kind" variant={variant} />);
    expect(container.querySelector('[data-slot="input"]')?.className).toContain(
      `input--${variant}`,
    );
  });

  it("passes unknown props through to HeroUI's root and keeps the caller's class", () => {
    const { container } = render(
      <TextField label="Name" className="mine" maxLength={5} data-testid="root" />,
    );
    const root = screen.getByTestId("root");
    expect(root.classList.contains("mine")).toBe(true);
    expect(container.querySelector("input")?.getAttribute("maxlength")).toBe("5");
  });

  it("matches the shared contract and refuses `fullWidth` and `children`", () => {
    expectTypeOf<TextFieldProps>().toExtend<TextFieldContractProps>();
    // @ts-expect-error `fullWidth` is `isFullWidth` in the contract
    createElement(TextField, { fullWidth: true });
    // @ts-expect-error the field draws its own parts
    const withChildren: TextFieldProps = { children: "x" };
    void withChildren;
    // @ts-expect-error a kind of text is one of the contract's
    createElement(TextField, { type: "number" });
  });
});
